import {gql} from '@apollo/client';

export const GET_FEE = gql`
  query GetFees {
    estimatedFee {
      txFees {
        fast
        average
      }
    }
  }
`;

export const GET_NONCE = gql`
  query accountByKey($publicKey: String!) {
    accountByKey(publicKey: $publicKey) {
      usableNonce
    }
  }
`;

export const GET_NONCE_AND_BALANCE = gql`
  query accountByKey($publicKey: String!) {
    accountByKey(publicKey: $publicKey) {
      usableNonce
      balance {
        total
        liquid
        locked
        liquidUnconfirmed
        unconfirmedTotal
      }
    }
  }
`;

export const BROADCAST_TRANSACTION = gql`
  mutation broadcastTransaction($input: SendPaymentInput!, $signature: SignatureInput!) {
    broadcastTransaction(input: $input, signature: $signature) {
      id
    }
  }
`;

export const BROADCAST_DELEGATION = gql`
  mutation broadcastDelegation($input: SendDelegationInput!, $signature: SignatureInput) {
    broadcastDelegation(input: $input, signature: $signature) {
      id
    }
  }
`;

export const GET_AVERAGE_FEE = gql`
  query GetFees {
    estimatedFee {
      txFees {
        average
      }
    }
  }
`;

export const GET_VALIDATORS = gql`
  query validators($offset: Int!) {
    validators(offset: $offset) {
      fee
      id
      image
      name
      publicKey
      website
      stakedSum
      priority
      publicKey
    }
  }
`;

export const GET_VALIDATORS_NEWS = gql`
  query NewsValidators {
    newsValidators {
      title
      subtitle
      link
      cta
      cta_color
    }
  }
`;

export const GET_NONCE_AND_DELEGATE = gql`
  query accountByKey($publicKey: String!) {
    accountByKey(publicKey: $publicKey) {
      delegate {
        publicKey
        name
      }
      usableNonce
    }
  }
`;

// export const GET_ID = gql`
//   query GetIDFromPublicKey($publicKey: String) {
//     public_keys(where: { value: { _eq: $publicKey } }) {
//       id
//     }
//   }
// `;

export const GET_ID = gql`
  query GetIDFromPublicKey($publicKey: String!) {
    idByPublicKey(publicKey: $publicKey) {
      id
    }
  }
`;

export const GET_TRANSACTIONS_TOTAL = gql`
  query TransactionsTotal($accountId: Int!) {
    transactionsCount(accountId: $accountId) {
      count
    }
  }
`;

// TODO: set back chainId and syncStatus, they are missing in the schema for the mocked networks
export const GET_NETWORK = gql`
  query NodeInfo {
    nodeInfo {
      height
      name
      network
      version
    }
  }
`;

export const GET_TICKER = gql`
  query ticker {
    ticker {
      BTCMINA
      USDTMINA
    }
  }
`;

export const GET_BALANCE = gql`
  query accountByKey($publicKey: String!) {
    accountByKey(publicKey: $publicKey) {
      balance {
        total
        liquid
        locked
        liquidUnconfirmed
        unconfirmedTotal
      }
    }
  }
`;

export const GET_VALIDATORS_TOTAL = gql`
  query CountValidators {
    validatorsCount {
      count
    }
  }
`;

// export const GET_TRANSACTIONS = gql`
//   query GetTransactions($user: Int!, $offset: Int!) {
//     user_commands(
//       where: {
//         _or: [{ receiver_id: { _eq: $user } }, { source_id: { _eq: $user } }]
//       }
//       order_by: { id: desc }
//       limit: ${TRANSACTIONS_TABLE_ITEMS_PER_PAGE}
//       offset: $offset
//     ) {
//       amount
//       fee
//       id
//       hash
//       memo
//       publicKeyBySourceId {
//         value
//       }
//       publicKeyByReceiverId {
//         value
//       }
//       token
//       type
//       valid_until
//       nonce
//       blocks_user_commands {
//         block {
//           height
//           timestamp
//           state_hash
//         }
//       }
//     }
//   }
// `;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($accountId: Int!, $offset: Int!) {
    transactions(accountId: $accountId, offset: $offset) {
      amount
      fee
      id
      hash
      memo
      source_id
      fee_payer_id
      receiver_id
      timestamp
      status
      sender_public_key
      receiver_public_key
      command_type
      valid_until
      nonce
      fee_payer_id
      failure_reason
    }
  }
`;

export const GET_MEMPOOL = gql`
  query GetMempool($publicKey: String!) {
    mempool(publicKey: $publicKey) {
      id
      fee
      feeToken
      kind
      amount
      nonce
      source {
        publicKey
      }
      receiver {
        publicKey
      }
    }
  }
`;

export const GET_HOME_NEWS = gql`
  query NewsHome {
    newsHome {
      title
      subtitle
      link
      cta
      cta_color
    }
  }
`;

export const GET_BLACKLIST = gql`
  query GetBlacklist {
    blacklistedAddresses {
      address
    }
  }
`;
