# Solidity API

## PartnerConfiguration

### _PERCENT100_WITH_PRECISION18

```solidity
uint256 _PERCENT100_WITH_PRECISION18
```

### _PRECISION18

```solidity
uint256 _PRECISION18
```

### _UN_NECESSARY_MODIFICATION_ERROR_MSG

```solidity
string _UN_NECESSARY_MODIFICATION_ERROR_MSG
```

### _VALUE_OUT_OF_BOUND_ERROR_MSG

```solidity
string _VALUE_OUT_OF_BOUND_ERROR_MSG
```

### constructor

```solidity
constructor(contract IAccessControl accessControl, uint256 minLength, uint256 maxLength, uint256 minDuration, uint256 maxDuration, uint256 feePercentage, uint256 discount, uint256 minCommitmentAge) public
```

### getMinLength

```solidity
function getMinLength() external view returns (uint256)
```

returns the minimum characters count allowed for a domain name

### setMinLength

```solidity
function setMinLength(uint256 minLength) external
```

sets the minimum length allowed for a domain name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minLength | uint256 | the minimum characters count allowed for a domain name |

### getMaxLength

```solidity
function getMaxLength() external view returns (uint256)
```

returns the maximum characters count allowed for a domain name

### setMaxLength

```solidity
function setMaxLength(uint256 maxLength) external
```

sets the maximum length allowed for a domain name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| maxLength | uint256 | the maximum characters count allowed for a domain name |

### getMinDuration

```solidity
function getMinDuration() external view returns (uint256)
```

returns the minimum duration in years allowed for a domain name purchase

### setMinDuration

```solidity
function setMinDuration(uint256 minDuration) external
```

sets the minimum duration allowed for a domain name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minDuration | uint256 | the minimum duration allowed for a domain name in years |

### getMaxDuration

```solidity
function getMaxDuration() external view returns (uint256)
```

returns the maximum duration in years allowed for a domain name purchase

### setMaxDuration

```solidity
function setMaxDuration(uint256 maxDuration) external
```

sets the maximum duration allowed for a domain name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| maxDuration | uint256 | the maximum duration allowed for a domain name in years |

### getFeePercentage

```solidity
function getFeePercentage() external view returns (uint256)
```

returns the fee percentage assigned to the partner for each domain name registered

### setFeePercentage

```solidity
function setFeePercentage(uint256 feePercentage) external
```

sets the fee percentage assigned to the partner for each domain name registered

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| feePercentage | uint256 | the percentage assigned to the partner for each domain name registered |

### getDiscount

```solidity
function getDiscount() external view returns (uint256)
```

returns the discount assigned to the partner for each domain name registered as a percentage

### setDiscount

```solidity
function setDiscount(uint256 discount) external
```

sets the discount assigned to the partner for each domain name registered

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| discount | uint256 | the discount assigned to the partner for each domain name registered. represented as a percentage 18 decimals precision representation |

### getMinCommitmentAge

```solidity
function getMinCommitmentAge() external view returns (uint256)
```

returns the minimum commitment age allowed for a domain name registration. Represented in seconds.

### setMinCommitmentAge

```solidity
function setMinCommitmentAge(uint256 minCommitmentAge) external
```

sets the minimum commitment age allowed for a domain name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minCommitmentAge | uint256 | the minimum commitment age allowed for a domain name in seconds |

### getPrice

```solidity
function getPrice(string, uint256, uint256 duration) external view returns (uint256)
```

returns the price of a domain name

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
|  | string |  |
|  | uint256 |  |
| duration | uint256 | the duration of the domain |

### validateName

```solidity
function validateName(string name, uint256 duration) external view
```

checks if the name is valid and reverts with reason if not

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | name under validation |
| duration | uint256 | duration for which the name should be registered |

