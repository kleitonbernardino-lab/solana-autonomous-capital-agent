#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    #[test]
    fn test_duplicate_nonce_rejected() {
        let mut seen_nonces = HashSet::new();
        let nonce_1 = [1u8; 32];
        let nonce_2 = [2u8; 32];

        assert!(seen_nonces.insert(nonce_1));
        assert!(seen_nonces.insert(nonce_2));
        assert!(!seen_nonces.insert(nonce_1), "Duplicate nonce must be rejected");
    }
}
