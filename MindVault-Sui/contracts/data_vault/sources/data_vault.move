/// MindVault: Privacy AI API Gateway
///
/// A Sui-native data vault that gives users 100% ownership of their AI conversation data.
/// Uses Dynamic Fields for authorization management, ensuring users can always revoke access.
module mindvault::data_vault {
    use sui::clock::{Self, Clock};
    use sui::dynamic_field;
    use sui::event;

    // ═══════════════════════════════════════════════════════════════════
    // Error Codes
    // ═══════════════════════════════════════════════════════════════════
    const ENotAuthorized: u64 = 0;
    const EInvalidScope: u64 = 1;
    const EBlobNotFound: u64 = 2;

    // ═══════════════════════════════════════════════════════════════════
    // Constants
    // ═══════════════════════════════════════════════════════════════════
    const SCOPE_READ: u8 = 1;
    const SCOPE_READ_WRITE: u8 = 2;

    #[allow(unused_const)]
    const BLOB_TYPE_CONVERSATION: u8 = 0;
    #[allow(unused_const)]
    const BLOB_TYPE_FILE: u8 = 1;

    // ═══════════════════════════════════════════════════════════════════
    // Core Object: DataVault - User's Data Safe
    // Sui Native: Uses Owned Object, only owner can modify
    // ═══════════════════════════════════════════════════════════════════
    public struct DataVault has key, store {
        id: UID,
        blob_count: u64,           // Number of stored blobs
        created_at: u64,           // Creation timestamp
        // Authorization list stored in Dynamic Fields, key = provider address
    }

    // ═══════════════════════════════════════════════════════════════════
    // Authorization Record: Stored in Vault's Dynamic Field
    // Key Design: Authorization data lives inside Vault, user always maintains control
    // ═══════════════════════════════════════════════════════════════════
    public struct Authorization has store, drop {
        provider: address,         // Authorized party address
        scope: u8,                 // Permission scope: 1=read, 2=read-write
        expires_at: u64,           // Expiration time (0=never expires)
        created_at: u64,
    }

    // ═══════════════════════════════════════════════════════════════════
    // Dynamic Field: BlobRef - Blob reference stored on Vault
    // Sui Native: Uses Dynamic Fields for extensible storage
    // ═══════════════════════════════════════════════════════════════════
    public struct BlobRef has store, drop {
        blob_id: vector<u8>,       // Walrus blob ID
        blob_type: u8,             // 0=conversation, 1=file
        iv: vector<u8>,            // AES-GCM initialization vector
        created_at: u64,
    }

    // Dynamic Field key types
    public struct BlobKey has copy, drop, store { index: u64 }
    public struct AuthKey has copy, drop, store { provider: address }

    // ═══════════════════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════════════════
    public struct VaultCreated has copy, drop {
        vault_id: ID,
        owner: address,
    }

    public struct BlobStored has copy, drop {
        vault_id: ID,
        index: u64,
        blob_type: u8,
    }

    public struct BlobDeleted has copy, drop {
        vault_id: ID,
        index: u64,
    }

    public struct AccessGranted has copy, drop {
        vault_id: ID,
        provider: address,
        scope: u8,
    }

    public struct AccessRevoked has copy, drop {
        vault_id: ID,
        provider: address,
    }

    // ═══════════════════════════════════════════════════════════════════
    // Create Vault - User calls this to get an Owned Object
    // ═══════════════════════════════════════════════════════════════════
    public entry fun create_vault(clock: &Clock, ctx: &mut TxContext) {
        let vault = DataVault {
            id: object::new(ctx),
            blob_count: 0,
            created_at: clock::timestamp_ms(clock),
        };

        event::emit(VaultCreated {
            vault_id: object::id(&vault),
            owner: ctx.sender(),
        });

        transfer::transfer(vault, ctx.sender());
    }

    // ═══════════════════════════════════════════════════════════════════
    // Store Blob Reference - Uses Dynamic Fields
    // Sui Native: Dynamic fields allow unlimited expansion, pay-as-you-go
    // ═══════════════════════════════════════════════════════════════════
    public entry fun store_blob(
        vault: &mut DataVault,
        blob_id: vector<u8>,
        blob_type: u8,
        iv: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let index = vault.blob_count;
        let blob_ref = BlobRef {
            blob_id,
            blob_type,
            iv,
            created_at: clock::timestamp_ms(clock),
        };

        dynamic_field::add(&mut vault.id, BlobKey { index }, blob_ref);
        vault.blob_count = index + 1;

        event::emit(BlobStored {
            vault_id: object::id(vault),
            index,
            blob_type,
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Delete Blob Reference
    // ═══════════════════════════════════════════════════════════════════
    public entry fun delete_blob(
        vault: &mut DataVault,
        index: u64,
        _ctx: &mut TxContext
    ) {
        let blob_key = BlobKey { index };
        assert!(dynamic_field::exists_(&vault.id, blob_key), EBlobNotFound);

        let _: BlobRef = dynamic_field::remove(&mut vault.id, blob_key);

        event::emit(BlobDeleted {
            vault_id: object::id(vault),
            index,
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Grant Access - Add authorization record inside Vault (no object transfer!)
    // Key Fix: Authorization data stored as Dynamic Field in user's Vault
    //          User always owns Vault, so can always revoke authorization
    // ═══════════════════════════════════════════════════════════════════
    public entry fun grant_access(
        vault: &mut DataVault,
        provider: address,
        scope: u8,
        expires_at: u64,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(scope == SCOPE_READ || scope == SCOPE_READ_WRITE, EInvalidScope);

        let auth_key = AuthKey { provider };

        // If authorization already exists, remove it first
        if (dynamic_field::exists_(&vault.id, auth_key)) {
            let _: Authorization = dynamic_field::remove(&mut vault.id, auth_key);
        };

        let auth = Authorization {
            provider,
            scope,
            expires_at,
            created_at: clock::timestamp_ms(clock),
        };

        dynamic_field::add(&mut vault.id, auth_key, auth);

        event::emit(AccessGranted {
            vault_id: object::id(vault),
            provider,
            scope,
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Revoke Access - User can revoke anytime since auth data is in their Vault
    // Key Fix: User operates on their own Vault, no Provider cooperation needed
    // ═══════════════════════════════════════════════════════════════════
    public entry fun revoke_access(
        vault: &mut DataVault,
        provider: address,
        _ctx: &mut TxContext
    ) {
        let auth_key = AuthKey { provider };

        assert!(dynamic_field::exists_(&vault.id, auth_key), ENotAuthorized);

        let _: Authorization = dynamic_field::remove(&mut vault.id, auth_key);

        event::emit(AccessRevoked {
            vault_id: object::id(vault),
            provider,
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Verify Access Permission - View function for backend to call
    // Provider queries Vault's Dynamic Field to verify if they're authorized
    // ═══════════════════════════════════════════════════════════════════
    public fun is_authorized(
        vault: &DataVault,
        provider: address,
        clock: &Clock
    ): bool {
        let auth_key = AuthKey { provider };

        if (!dynamic_field::exists_(&vault.id, auth_key)) {
            return false
        };

        let auth: &Authorization = dynamic_field::borrow(&vault.id, auth_key);

        // Check if expired
        auth.expires_at == 0 || auth.expires_at > clock::timestamp_ms(clock)
    }

    // ═══════════════════════════════════════════════════════════════════
    // Get Authorization Details - View function
    // ═══════════════════════════════════════════════════════════════════
    public fun get_authorization(
        vault: &DataVault,
        provider: address
    ): (u8, u64) {  // (scope, expires_at)
        let auth_key = AuthKey { provider };
        let auth: &Authorization = dynamic_field::borrow(&vault.id, auth_key);
        (auth.scope, auth.expires_at)
    }

    // ═══════════════════════════════════════════════════════════════════
    // Get Blob Reference - View function
    // ═══════════════════════════════════════════════════════════════════
    public fun get_blob_ref(
        vault: &DataVault,
        index: u64
    ): (vector<u8>, u8, vector<u8>, u64) {  // (blob_id, blob_type, iv, created_at)
        let blob_key = BlobKey { index };
        let blob_ref: &BlobRef = dynamic_field::borrow(&vault.id, blob_key);
        (blob_ref.blob_id, blob_ref.blob_type, blob_ref.iv, blob_ref.created_at)
    }

    // ═══════════════════════════════════════════════════════════════════
    // Get Vault Info - View function
    // ═══════════════════════════════════════════════════════════════════
    public fun get_vault_info(vault: &DataVault): (u64, u64) {  // (blob_count, created_at)
        (vault.blob_count, vault.created_at)
    }

    // ═══════════════════════════════════════════════════════════════════
    // Check if blob exists
    // ═══════════════════════════════════════════════════════════════════
    public fun blob_exists(vault: &DataVault, index: u64): bool {
        dynamic_field::exists_(&vault.id, BlobKey { index })
    }

    // ═══════════════════════════════════════════════════════════════════
    // Check if authorization exists
    // ═══════════════════════════════════════════════════════════════════
    public fun auth_exists(vault: &DataVault, provider: address): bool {
        dynamic_field::exists_(&vault.id, AuthKey { provider })
    }
}
