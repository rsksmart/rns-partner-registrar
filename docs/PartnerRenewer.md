# Solidity API

## PartnerRenewer

### constructor

```solidity
constructor(contract IAccessControl accessControl, contract NodeOwner nodeOwner, contract IERC677 rif, contract IPartnerManager partnerManager) public
```

### onlyPartner

```solidity
modifier onlyPartner(address partner)
```

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

### price

```solidity
function price(string name, uint256 duration, address partner) external view returns (uint256)
```

calculates the price of a name
        @param name the name to register
        @param duration the duration of the registration in years
        @param partner Partner address
        @return the price of the name

### renew

```solidity
function renew(string name, uint256 duration, address partner) public
```

allows domain name owner to renew their ownership

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | the domain name to be renewed |
| duration | uint256 | the duration of the renewal |
| partner | address | Partner address |

