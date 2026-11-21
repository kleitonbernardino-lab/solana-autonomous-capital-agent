# Constant-Product AMM Liquidity Routing Specification

## Invariant Formulation
For pool reserves $x, y$ with fee $\phi$:
$$(x + \Delta x (1 - \phi))(y - \Delta y) = xy$$

## Maximum Slippage Bound
For expected output $\Delta y_{exp}$ and tolerance $\epsilon$:
$$\Delta y_{min} = \Delta y_{exp} \times (1 - \epsilon)$$
Transactions must abort on-chain if received output violates $\Delta y_{min}$.
