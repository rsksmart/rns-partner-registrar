# RegistrarAccessControl

*Identity Team @IOVLabs*

> RegistrarAccessControl

Defines Access Control roles management



## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### addHighLevelOperator

```solidity
function addHighLevelOperator(address highLevelOperator) external nonpayable
```

Grants address all HIGH_LEVEL_OPERATOR roles. Only executable by the owner.

*only user granted as OWNER can perform this operation*

#### Parameters

| Name | Type | Description |
|---|---|---|
| highLevelOperator | address | address to grant HIGH_LEVEL_OPERATOR role |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleGranted} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isHighLevelOperator

```solidity
function isHighLevelOperator(address highLevelOperator) external view returns (bool)
```

Returns `true` if address has been granted the HIGH_LEVEL_OPERATOR role.



#### Parameters

| Name | Type | Description |
|---|---|---|
| highLevelOperator | address | address to evaluate if has HIGH_LEVEL_OPERATOR role |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | bool - true if the address has HIGH_LEVEL_OPERATOR role |

### isOwnerRole

```solidity
function isOwnerRole(address owner) external view returns (bool)
```

Returns `true` if address has been granted the OWNER role.



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | address to evaluate if has OWNER role |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | bool - true if the owner address has OWNER role |

### removeHighLevelOperator

```solidity
function removeHighLevelOperator(address highLevelOperator) external nonpayable
```

Revokes address all HIGH_LEVEL_OPERATOR roles. Only executable by the owner.

*only user granted as OWNER can perform this operation*

#### Parameters

| Name | Type | Description |
|---|---|---|
| highLevelOperator | address | address to revoke HIGH_LEVEL_OPERATOR role |

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role. May emit a {RoleRevoked} event.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

Transfers all OWNER and HIGH_LEVEL_OPERATOR roles to the given address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | address to be grant OWNER and all MANAGER roles. |



## Events

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |



## Errors

### OnlyOwner

```solidity
error OnlyOwner(address sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| sender | address | undefined |


