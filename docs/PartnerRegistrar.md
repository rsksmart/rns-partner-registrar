# Solidity API

## PartnerRegistrar

### constructor

```solidity
constructor(contract IAccessControl accessControl, contract NodeOwner nodeOwner, contract IERC677 rif, contract IPartnerManager partnerManager, contract RNS rns, bytes32 rootNode) public
```

### onlyPartner

```solidity
modifier onlyPartner(address partner)
```

### getPartnerManager

```solidity
function getPartnerManager() external view returns (contract IPartnerManager)
```

returns the partner manager that the registrar has been configured to use

### setFeeManager

```solidity
function setFeeManager(contract IFeeManager feeManager) external
```

sets the fee manager to use. Mandatory for the renewer to work.
        @param feeManager the fee manager to use
        @custom:emits-event emits the FeeManagerSet event

### tokenFallback

```solidity
function tokenFallback(address from, uint256 value, bytes data) external returns (bool)
```

ERC-677 token fallback function.

_Follow 'Register encoding' to execute a one-transaction regitration._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | token sender. |
| value | uint256 | amount of tokens sent. |
| data | bytes | data associated with transaction. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if successfull. |

### register

```solidity
function register(string name, address nameOwner, bytes32 secret, uint256 duration, address addr, address partner) public
```

Registers a .rsk name in RNS.

_This method must be called after commiting._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name to register. |
| nameOwner | address | The owner of the name to regiter. |
| secret | bytes32 | The secret used to make the commitment. |
| duration | uint256 | Time to register in years. |
| addr | address | Address to set as addr resolution. |
| partner | address | Partner address |

### price

```solidity
function price(string name, uint256 expires, uint256 duration, address partner) public view returns (uint256)
```

calculates the price of a name
        @param name the name to register
        @param expires the expiration date of the name
        @param duration the duration of the registration in years
        @param partner Partner address
        @return the price of the name

### makeCommitment

```solidity
function makeCommitment(bytes32 label, address nameOwner, bytes32 secret, uint256 duration, address addr) public pure returns (bytes32)
```

calculates the commitment of a name based on the provided parameters
        @param label the label of the name
        @param nameOwner the owner of the name
        @param secret used in the commitment step if required
        @param duration the duration of the registration in years
        @param addr to be resolved to the name as default
        @return the commitment of the name

### canReveal

```solidity
function canReveal(bytes32 commitment) public view returns (bool)
```

reveals if the name is ready to be registered by calling register function. Meant to be called after a commitment.
        @param commitment the commitment of the name
        @return true if the name is ready to be registered

### commit

```solidity
function commit(bytes32 commitment, address partner) public
```

commits a name if required. This is used to reserve a name
        for a specific user and prevent a frontrunning attack
        @param commitment the commitment of the name
        @param partner Partner address

