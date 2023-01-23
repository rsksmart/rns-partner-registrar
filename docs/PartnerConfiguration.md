# PartnerConfiguration

*Identity Team @IOVLabs*

> Defines the configuration for a partner in particular





## Methods

### getDiscount

```solidity
function getDiscount() external view returns (uint256)
```

returns the discount assigned to the partner for each domain name registered as a percentage




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getFeePercentage

```solidity
function getFeePercentage() external view returns (uint256)
```

returns the fee percentage assigned to the partner for each domain name registered




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMaxDuration

```solidity
function getMaxDuration() external view returns (uint256)
```

returns the maximum duration in years allowed for a domain name purchase




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMaxLength

```solidity
function getMaxLength() external view returns (uint256)
```

returns the maximum characters count allowed for a domain name




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMinCommitmentAge

```solidity
function getMinCommitmentAge() external view returns (uint256)
```

returns the minimum commitment age allowed for a domain name registration. Represented in seconds.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMinDuration

```solidity
function getMinDuration() external view returns (uint256)
```

returns the minimum duration in years allowed for a domain name purchase




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getMinLength

```solidity
function getMinLength() external view returns (uint256)
```

returns the minimum characters count allowed for a domain name




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getPrice

```solidity
function getPrice(string name, uint256 expires, uint256 duration) external view returns (uint256)
```

returns the price of a domain name



#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | the name of the domain |
| expires | uint256 | the expiration date of the domain. it is being ignored. left just for compatibility. just send 0. |
| duration | uint256 | the duration of the domain |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getUnicodeSupport

```solidity
function getUnicodeSupport() external view returns (bool)
```

returns support for unicode domains




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setDiscount

```solidity
function setDiscount(uint256 discount) external nonpayable
```

sets the discount assigned to the partner for each domain name registered



#### Parameters

| Name | Type | Description |
|---|---|---|
| discount | uint256 | the discount assigned to the partner for each domain name registered. represented as a percentage 18 decimals precision representation |

### setFeePercentage

```solidity
function setFeePercentage(uint256 feePercentage) external nonpayable
```

sets the fee percentage assigned to the partner for each domain name registered



#### Parameters

| Name | Type | Description |
|---|---|---|
| feePercentage | uint256 | the percentage assigned to the partner for each domain name registered |

### setMaxDuration

```solidity
function setMaxDuration(uint256 maxDuration) external nonpayable
```

sets the maximum duration allowed for a domain name



#### Parameters

| Name | Type | Description |
|---|---|---|
| maxDuration | uint256 | the maximum duration allowed for a domain name in years |

### setMaxLength

```solidity
function setMaxLength(uint256 maxLength) external nonpayable
```

sets the maximum length allowed for a domain name



#### Parameters

| Name | Type | Description |
|---|---|---|
| maxLength | uint256 | the maximum characters count allowed for a domain name |

### setMinCommitmentAge

```solidity
function setMinCommitmentAge(uint256 minCommitmentAge) external nonpayable
```

sets the minimum commitment age allowed for a domain name



#### Parameters

| Name | Type | Description |
|---|---|---|
| minCommitmentAge | uint256 | the minimum commitment age allowed for a domain name in seconds |

### setMinDuration

```solidity
function setMinDuration(uint256 minDuration) external nonpayable
```

sets the minimum duration allowed for a domain name



#### Parameters

| Name | Type | Description |
|---|---|---|
| minDuration | uint256 | the minimum duration allowed for a domain name in years |

### setMinLength

```solidity
function setMinLength(uint256 minLength) external nonpayable
```

sets the minimum length allowed for a domain name



#### Parameters

| Name | Type | Description |
|---|---|---|
| minLength | uint256 | the minimum characters count allowed for a domain name |

### setUnicodeSupport

```solidity
function setUnicodeSupport(bool flag) external nonpayable
```

sets support for unicode domains



#### Parameters

| Name | Type | Description |
|---|---|---|
| flag | bool | true if unicode domains are supported, false otherwise |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### validateName

```solidity
function validateName(string name, uint256 duration) external view
```

checks if the name is valid and reverts with reason if not



#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | name under validation |
| duration | uint256 | duration for which the name should be registered |



## Events

### DiscountChanged

```solidity
event DiscountChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the discount is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### FeePercentageChanged

```solidity
event FeePercentageChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the fee percentage is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### MaxDurationChanged

```solidity
event MaxDurationChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the maximum duration is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### MaxLengthChanged

```solidity
event MaxLengthChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the maximum length is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### MinCommitmentAgeChanged

```solidity
event MinCommitmentAgeChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the minimum commitment age is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### MinDurationChanged

```solidity
event MinDurationChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the minimum duration is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### MinLengthChanged

```solidity
event MinLengthChanged(uint256 previousValue, uint256 newValue)
```

event emitted when the minimum length is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | uint256 | undefined |
| newValue  | uint256 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### UnicodeSupportChanged

```solidity
event UnicodeSupportChanged(bool previousValue, bool newValue)
```

event emitted when unicode support status is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| previousValue  | bool | undefined |
| newValue  | bool | undefined |



## Errors

### InvalidDuration

```solidity
error InvalidDuration(uint256 duration, string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| duration | uint256 | undefined |
| reason | string | undefined |

### InvalidLength

```solidity
error InvalidLength(uint256 length, string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| length | uint256 | undefined |
| reason | string | undefined |

### InvalidName

```solidity
error InvalidName(string name, string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| name | string | undefined |
| reason | string | undefined |


