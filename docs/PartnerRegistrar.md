# PartnerRegistrar

*Identity Team @IOVLabs*

> Implements the interface IBaseRegistrar to register names in RNS. Takes into account the partners for the revenue sharing. 





## Methods

### canReveal

```solidity
function canReveal(bytes32 commitment) external view returns (bool)
```

reveals if the name is ready to be registered by calling register function. Meant to be called after a commitment. 



#### Parameters

| Name | Type | Description |
|---|---|---|
| commitment | bytes32 | the commitment of the name |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | true if the name is ready to be registered |

### commit

```solidity
function commit(bytes32 commitment, address partner) external nonpayable
```

commits a name if required. This is used to reserve a name for a specific user and prevent a frontrunning attack



#### Parameters

| Name | Type | Description |
|---|---|---|
| commitment | bytes32 | the commitment of the name |
| partner | address | Partner address |

### makeCommitment

```solidity
function makeCommitment(bytes32 label, address nameOwner, bytes32 secret, uint256 duration, address addr) external pure returns (bytes32)
```

calculates the commitment of a name based on the provided parameters



#### Parameters

| Name | Type | Description |
|---|---|---|
| label | bytes32 | the label of the name |
| nameOwner | address | the owner of the name |
| secret | bytes32 | used in the commitment step if required |
| duration | uint256 | the duration of the registration in years |
| addr | address | to be resolved to the name as default |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | the commitment of the name |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### price

```solidity
function price(string name, uint256 expires, uint256 duration, address partner) external view returns (uint256)
```

calculates the price of a name



#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | the name to register |
| expires | uint256 | the expiration date of the name |
| duration | uint256 | the duration of the registration in years |
| partner | address | Partner address |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | the price of the name |

### register

```solidity
function register(string name, address nameOwner, bytes32 secret, uint256 duration, address addr, address partner) external nonpayable
```

Registers a .rsk name in RNS.

*This method must be called after commiting.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | The name to register. |
| nameOwner | address | The owner of the name to regiter. |
| secret | bytes32 | The secret used to make the commitment. |
| duration | uint256 | Time to register in years. |
| addr | address | Address to set as addr resolution. |
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

### NameRegistered

```solidity
event NameRegistered(address indexed partner, uint256 duration)
```

event emitted when a domain has been successfully registered



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



