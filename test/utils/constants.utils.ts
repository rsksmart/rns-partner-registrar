// ERRORS
export const UN_NECESSARY_MODIFICATION_ERROR_MSG =
  'Param being modified is same as new param';
export const VALUE_OUT_OF_PERCENT_RANGE_ERROR_MSG =
  'Value must be within range 0 to 100';

// EVENTS
export const MIN_DURATION_CHANGED_EVENT = 'MinDurationChanged';
export const MAX_DURATION_CHANGED_EVENT = 'MaxDurationChanged';
export const UNICODE_SUPPORT_CHANGED_EVENT = 'UnicodeSupportChanged';
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

// CONSTANT VALUES
export const DEFAULT_MIN_LENGTH = 3;
export const DEFAULT_MAX_LENGTH = 7;
export const DEFAULT_MIN_DURATION = 1;
export const DEFAULT_MAX_DURATION = 2;
export const DEFAULT_MIN_COMMITMENT_AGE = 0;
export const DEFAULT_DISCOUNT = 4;
export const DEFAULT_IS_UNICODE_SUPPORTED = false;
export const DEFAULT_FEE_PERCENTAGE = 5;
