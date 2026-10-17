// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SkillChainCredentialRegistry
 * @dev Non-transferable verifiable credential registry for SkillChain.
 * Anchors privacy-preserving cryptographic commitments of academic degrees,
 * skill assessments, and professional credentials.
 * Team: Beast Coders
 */
contract SkillChainCredentialRegistry is AccessControl, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    enum CredentialStatus {
        None,        // 0: Credential does not exist
        Active,      // 1: Valid and active
        Suspended,   // 2: Temporarily suspended pending institutional review
        Revoked      // 3: Permanently revoked
    }

    struct CredentialRecord {
        bytes32 commitment;       // Cryptographic hash (sha256/keccak256) of off-chain W3C payload + salt
        address studentWallet;    // Soulbound holder wallet address (0x0 if student unassigned or off-chain)
        address issuer;           // Authorized issuing institution address
        uint64 issuedAt;          // Timestamp of issuance
        uint64 revokedAt;         // Timestamp of revocation (0 if active/suspended)
        CredentialStatus status;  // Current verifiable status
        string credentialTypeURI; // W3C Schema / Type identifier (e.g. "https://skillchain.org/credentials/degree/v1")
    }

    struct IssuerInfo {
        string institutionName;
        string metadataURI;
        bool isAuthorized;
        uint64 registeredAt;
    }

    // Mapping from unique credential ID to on-chain record
    mapping(bytes32 => CredentialRecord) private _credentials;

    // Mapping from issuer address to institutional metadata
    mapping(address => IssuerInfo) private _issuers;

    // Events
    event IssuerRegistered(address indexed issuer, string institutionName, string metadataURI);
    event IssuerRemoved(address indexed issuer);
    event CredentialIssued(
        bytes32 indexed credId,
        bytes32 indexed commitment,
        address indexed issuer,
        address studentWallet,
        string credentialTypeURI,
        uint64 issuedAt
    );
    event CredentialSuspended(bytes32 indexed credId, address indexed issuer, string reason, uint64 timestamp);
    event CredentialRestored(bytes32 indexed credId, address indexed issuer, uint64 timestamp);
    event CredentialRevoked(bytes32 indexed credId, address indexed issuer, string reason, uint64 timestamp);

    // Custom Errors
    error IssuerAlreadyRegistered(address issuer);
    error IssuerNotRegistered(address issuer);
    error UnauthorizedIssuer(address caller);
    error CredentialAlreadyExists(bytes32 credId);
    error CredentialNotFound(bytes32 credId);
    error InvalidCredentialStatus(bytes32 credId, CredentialStatus currentStatus);
    error ZeroAddressNotAllowed();
    error EmptyCommitmentNotAllowed();

    constructor(address defaultAdmin) {
        if (defaultAdmin == address(0)) revert ZeroAddressNotAllowed();
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    /**
     * @notice Registers an authorized university or certification authority
     * @param issuer The address of the institutional issuer
     * @param institutionName Human-readable name of the university / authority
     * @param metadataURI Off-chain URL/IPFS hash describing the accreditation
     */
    function registerIssuer(
        address issuer,
        string calldata institutionName,
        string calldata metadataURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (issuer == address(0)) revert ZeroAddressNotAllowed();
        if (_issuers[issuer].isAuthorized) revert IssuerAlreadyRegistered(issuer);

        _issuers[issuer] = IssuerInfo({
            institutionName: institutionName,
            metadataURI: metadataURI,
            isAuthorized: true,
            registeredAt: uint64(block.timestamp)
        });

        _grantRole(ISSUER_ROLE, issuer);
        emit IssuerRegistered(issuer, institutionName, metadataURI);
    }

    /**
     * @notice Revokes issuer privileges from an institution
     */
    function removeIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!_issuers[issuer].isAuthorized) revert IssuerNotRegistered(issuer);

        _issuers[issuer].isAuthorized = false;
        _revokeRole(ISSUER_ROLE, issuer);
        emit IssuerRemoved(issuer);
    }

    /**
     * @notice Issues a verifiable credential record with a privacy-preserving commitment
     * @param credId Opaque UUID or hash uniquely identifying the credential
     * @param commitment Cryptographic commitment (salted hash of W3C payload)
     * @param studentWallet Holder wallet address
     * @param credentialTypeURI Identifier for the credential schema
     */
    function issueCredential(
        bytes32 credId,
        bytes32 commitment,
        address studentWallet,
        string calldata credentialTypeURI
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        if (_credentials[credId].status != CredentialStatus.None) {
            revert CredentialAlreadyExists(credId);
        }
        if (commitment == bytes32(0)) revert EmptyCommitmentNotAllowed();

        _credentials[credId] = CredentialRecord({
            commitment: commitment,
            studentWallet: studentWallet,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            status: CredentialStatus.Active,
            credentialTypeURI: credentialTypeURI
        });

        emit CredentialIssued(
            credId,
            commitment,
            msg.sender,
            studentWallet,
            credentialTypeURI,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Temporarily suspends a credential pending administrative investigation
     */
    function suspendCredential(bytes32 credId, string calldata reason) external whenNotPaused {
        CredentialRecord storage record = _credentials[credId];
        if (record.status == CredentialStatus.None) revert CredentialNotFound(credId);
        if (record.status != CredentialStatus.Active) {
            revert InvalidCredentialStatus(credId, record.status);
        }
        if (record.issuer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedIssuer(msg.sender);
        }

        record.status = CredentialStatus.Suspended;
        emit CredentialSuspended(credId, msg.sender, reason, uint64(block.timestamp));
    }

    /**
     * @notice Restores a previously suspended credential to active status
     */
    function restoreCredential(bytes32 credId) external whenNotPaused {
        CredentialRecord storage record = _credentials[credId];
        if (record.status == CredentialStatus.None) revert CredentialNotFound(credId);
        if (record.status != CredentialStatus.Suspended) {
            revert InvalidCredentialStatus(credId, record.status);
        }
        if (record.issuer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedIssuer(msg.sender);
        }

        record.status = CredentialStatus.Active;
        emit CredentialRestored(credId, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Permanently revokes a credential
     */
    function revokeCredential(bytes32 credId, string calldata reason) external whenNotPaused {
        CredentialRecord storage record = _credentials[credId];
        if (record.status == CredentialStatus.None) revert CredentialNotFound(credId);
        if (record.status == CredentialStatus.Revoked) {
            revert InvalidCredentialStatus(credId, record.status);
        }
        if (record.issuer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedIssuer(msg.sender);
        }

        record.status = CredentialStatus.Revoked;
        record.revokedAt = uint64(block.timestamp);
        emit CredentialRevoked(credId, msg.sender, reason, uint64(block.timestamp));
    }

    /**
     * @notice Public verification query returning credential integrity and status
     */
    function getCredential(bytes32 credId)
        external
        view
        returns (
            CredentialStatus status,
            bytes32 commitment,
            address issuer,
            address studentWallet,
            uint64 issuedAt,
            uint64 revokedAt,
            string memory credentialTypeURI
        )
    {
        CredentialRecord memory record = _credentials[credId];
        return (
            record.status,
            record.commitment,
            record.issuer,
            record.studentWallet,
            record.issuedAt,
            record.revokedAt,
            record.credentialTypeURI
        );
    }

    /**
     * @notice Checks if an address is currently an authorized institutional issuer
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return _issuers[issuer].isAuthorized && hasRole(ISSUER_ROLE, issuer);
    }

    /**
     * @notice Returns institutional metadata for an issuer
     */
    function getIssuerInfo(address issuer)
        external
        view
        returns (
            string memory institutionName,
            string memory metadataURI,
            bool isAuthorized,
            uint64 registeredAt
        )
    {
        IssuerInfo memory info = _issuers[issuer];
        return (info.institutionName, info.metadataURI, info.isAuthorized, info.registeredAt);
    }

    // Emergency pause functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
