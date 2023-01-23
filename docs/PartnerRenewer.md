# PartnerRenewer

*Identity Team @IOVLabs*

> Implements the interface IBaseRenewer to renew names in RNS.





## Methods

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renew

```solidity
function renew(string name, uint256 duration, address partner) external nonpayable
```

allows domain name owner to renew their ownership



#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | the domain name to be renewed |
| duration | uint256 | the duration of the renewal |
| partner | address | Partner address |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setFeeManager

```solidity
function setFeeManager(contract IFeeManager feeManager) external nonpayable
```

sets the fee manager to use. Mandatory for the renewer to work.



#### Parameters

| Name | Type | Description |
|---|---|---|
| feeManager | contract IFeeManager | the fee manager to use |

### tokenFallback

```solidity
function tokenFallback(address from, uint256 value, bytes data) external nonpayable returns (bool)
```

ERC-677 token fallback function.

*Follow &#39;Register encoding&#39; to execute a one-transaction regitration.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | token sender. |
| value | uint256 | amount of tokens sent. |
| data | bytes | data associated with transaction. |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | true if successfull. |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |



## Events

### FeeManagerChanged

```solidity
event FeeManagerChanged(address hostContract, address feeManagerContract)
```

event emitted when a fee manager contract is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| hostContract  | address | undefined |
| feeManagerContract  | address | undefined |

### NameRenewed

```solidity
event NameRenewed(address indexed partner, uint256 duration)
```

event emitted when a domain has been successfully renewed



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner `indexed` | address | undefined |
| duration  | uint256 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



