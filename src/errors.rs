#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExecutionError {
    SlippageExceeded { expected: u64, actual: u64 },
    BlockhashExpired { blockhash: [u8; 32] },
    InsufficientLiquidity { required: u64, available: u64 },
    SignatureVerificationFailed,
}

impl std::fmt::Display for ExecutionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::SlippageExceeded { expected, actual } => {
                write!(f, "Slippage exceeded: expected {}, got {}", expected, actual)
            }
            Self::BlockhashExpired { .. } => write!(f, "Blockhash expired"),
            Self::InsufficientLiquidity { .. } => write!(f, "Insufficient pool liquidity"),
            Self::SignatureVerificationFailed => write!(f, "Signature verification failed"),
        }
    }
}

impl std::error::Error for ExecutionError {}
