# Motion system

Motion uses the locked named timing/easing set: micro 90–140 ms, controls 140–180 ms, panels 180–240 ms, workflow 240–320 ms, and the one-time RUL reveal 700–900 ms. Regular translation is at most 8 px, hover scale at most 1.012, and press scale no lower than 0.985.

Only a critical pulse, subtle SensorLattice drift, and loading indicator may repeat. Reduced-motion mode removes drift and renders workflow and RUL states immediately. Charts do not interpolate between measured cycles.

