/**
 * SSH key management type definitions
 */

/**
 * Represents an SSH key pair
 */
export interface SSHKeyPair {
  /** Public key content */
  publicKey: string;
  /** Private key content */
  privateKey: string;
  /** Key type (e.g., 'rsa', 'ed25519') */
  type: string;
  /** Key fingerprint */
  fingerprint: string;
}

/**
 * Represents a stored SSH key
 */
export interface StoredSSHKey {
  /** Unique identifier */
  id: string;
  /** Key name/label */
  name: string;
  /** Public key content */
  publicKey: string;
  /** Key fingerprint */
  fingerprint: string;
  /** Key type */
  type: string;
  /** Creation date */
  createdAt: Date;
  /** Associated remote URLs */
  remotes: string[];
}

/**
 * Options for generating SSH keys
 */
export interface SSHKeyGenerationOptions {
  /** Key type */
  type: 'rsa' | 'ed25519' | 'ecdsa';
  /** Key size in bits (for RSA) */
  bits?: number;
  /** Passphrase for private key encryption */
  passphrase?: string;
  /** Comment to add to the key */
  comment?: string;
}
