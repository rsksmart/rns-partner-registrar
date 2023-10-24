import { ethers } from 'hardhat';

// ERRORS
export const UN_NECESSARY_MODIFICATION_ERROR_MSG =
  'old value is same as new value';
export const ONLY_OWNER_ERR = 'OnlyOwner';
export const VALUE_OUT_OF_PERCENT_RANGE_ERROR_MSG =
  'Value must be within range 0 to 100000000000000000000'; // 100000000000000000000 here is the precision representation of 100%
export const ONLY_HIGH_LEVEL_OPERATOR_ERR = 'OnlyHighLevelOperator';
export const PARTNER_ALREADY_EXISTS = 'Partner already exists';
export const INVALID_ADDRESS_ERR =
  'resolver or addr is not configured for ENS name (argument="name", value="", code=INVALID_ARGUMENT, version=contracts/5.7.0)';
export const INVALID_PARTNER_CONFIGURATION_ERR =
  'PartnerManager: Invalid configuration';
export const INVALID_PARTNER_ERR = 'PartnerManager: Invalid partner';
export const INVALID_NAME_ERR = 'Invalid name';
export const NOT_A_PARTNER_ERR = 'Not a partner';
export const NO_COMMITMENT_FOUND_ERR = 'No commitment found';
export const COMMITMENT_NOT_REQUIRED_ERR = 'Commitment not required';
export const ONLY_RIF_TOKEN_ERR = 'Only RIF token';

// EVENTS
export const MIN_DURATION_CHANGED_EVENT = 'MinDurationChanged';
export const MAX_DURATION_CHANGED_EVENT = 'MaxDurationChanged';
export const MIN_LENGTH_CHANGED_EVENT = 'MinLengthChanged';
export const MAX_LENGTH_CHANGED_EVENT = 'MaxLengthChanged';
export const FEE_PERCENTAGE_CHANGED_EVENT = 'FeePercentageChanged';
export const DISCOUNT_CHANGED_EVENT = 'DiscountChanged';
export const MIN_COMMITMENT_AGE_CHANGED_EVENT = 'MinCommitmentAgeChanged';
export const DEPOSIT_SUCCESSFUL_EVENT = 'DepositSuccessful';
export const WITHDRAWAL_SUCCESSFUL_EVENT = 'WithdrawalSuccessful';
export const NAME_RENEWED_EVENT = 'NameRenewed';
export const FEE_MANAGER_CHANGED_EVENT = 'FeeManagerChanged';
export const NAME_REGISTERED_EVENT = 'NameRegistered';
export const PARTNER_CONFIGURATION_CHANGED_EVENT =
  'PartnerConfigurationChanged';

export const PARTNER_MANAGER_CHANGED_EVENT = 'PartnerManagerChanged';
export const PARTNER_ADDED_EVENT = 'PartnerAdded';
export const PARTNER_REMOVED_EVENT = 'PartnerRemoved';

// CONSTANT VALUES
export const DEFAULT_MIN_LENGTH = 3;
export const DEFAULT_MAX_LENGTH = 7;
export const DEFAULT_MIN_DURATION = 1;
export const DEFAULT_MAX_DURATION = 2;
export const DEFAULT_MIN_COMMITMENT_AGE = 0;
export const DEFAULT_DISCOUNT = 0;
export const DEFAULT_FEE_PERCENTAGE = 5;

export const ADDRESS_ZERO = ethers.constants.AddressZero;
