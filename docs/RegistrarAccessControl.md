# Solidity API

## RegistrarAccessControl

### onlyOwner

```solidity
modifier onlyOwner()
```

Checks if the action is done by an owner address.
Reverts with reason: 'Not an owner'

### constructor

```solidity
constructor() public
```

_Sets OWNER the HIGH_LEVEL_OPERATOR and OWNER roles' admin.
Grants deployer address IAccessControl and OWNER roles._

### isOwnerRole

```solidity
function isOwnerRole(address owner) external view returns (bool)
```

Returns `true` if address has been granted the OWNER role.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | address to evaluate if has OWNER role |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool - true if the owner address has OWNER role |

### isHighLevelOperator

```solidity
function isHighLevelOperator(address highLevelOperator) external view returns (bool)
```

Returns `true` if address has been granted the HIGH_LEVEL_OPERATOR role.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| highLevelOperator | address | address to evaluate if has HIGH_LEVEL_OPERATOR role |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool - true if the address has HIGH_LEVEL_OPERATOR role |

### addHighLevelOperator

```solidity
function addHighLevelOperator(address highLevelOperator) external
```

Grants address all HIGH_LEVEL_OPERATOR roles.
Only executable by the owner.

_only user granted as OWNER can perform this operation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| highLevelOperator | address | address to grant HIGH_LEVEL_OPERATOR role |

### removeHighLevelOperator

```solidity
function removeHighLevelOperator(address highLevelOperator) external
```

Revokes address all HIGH_LEVEL_OPERATOR roles.
Only executable by the owner.

_only user granted as OWNER can perform this operation_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| highLevelOperator | address | address to revoke HIGH_LEVEL_OPERATOR role |

### transferOwnership

```solidity
function transferOwnership(address newOwner) public
```

Transfers all OWNER and HIGH_LEVEL_OPERATOR roles to the given address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOwner | address | address to be grant OWNER and all MANAGER roles. |

