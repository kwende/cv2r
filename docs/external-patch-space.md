# External patch space v1

The owned fork can reserve space for a separately maintained patch applied
after CV2R. This facility contains no external gameplay logic.

Use `--external-patch-space` with exactly one world mode, `town-rando` or
`map-rando`. The audited optional additions are `100-hearts`,
`penalty-reduction`, `enemizer`, `enemy-hp` and `price-rando`, independently or
in combination. For example:
`--patch map-rando,enemizer,enemy-hp,price-rando --external-patch-space`.
Duplicate flags, two world modes, and other combinations are rejected until audited.
Without the flag, existing generation and patch output remain unchanged.

| Resource | External owner | CV2R allocation limit |
|---|---|---|
| PRG bank1 | CPU BD00-BEFF, headered file07D10-07F0F (512 bytes) | BD00 exclusive |
| Fixed PRG | CPU FF80-FFDF, file1FF90-1FFEF (96 bytes) | FF80 exclusive |
| Work RAM | CPU60F0-60F1 | Cleared by existing full-startup page clear; no gameplay reset |

Core bank7 expansion already relocates RESET and updates the reset vector.
The reservation fill runs only after that relocation. It never overwrites the
vectors atFFFA-FFFF. All generated literal/copy operations are checked against
the reserved ranges before FF initialization operations are added. Allocator
overflow or a conflicting direct write aborts generation.

JSON output adds `externalPatchSpace` with schemaVersion1, profile
`cv2-external-v1`, exact PRG ranges and RAM initialization semantics. File-mode
generation also writes `<patch-file>.external-space.json`. External patchers
must check this contract, their native hook signatures and the actual blank
reservation bytes. A contract is not an assertion that arbitrary gameplay
hooks or transition assumptions are compatible.

RAM audit for the supported core/Town/Map profile found60F0-60F1 outside core
scratch, warp state, check records and statistics. The existing startup loop
clears6000-60FF, including the reservation. Later patches must respect this
ownership; adding optional profiles requires another RAM/hook audit.

The enemy/HP/price additions reuse CV2R's existing optional patches. Enemizer
writes actor records, a per-location pattern table and the pattern resolver
hook at file 1CCDF, with its worker at 07860; its assembly preserves scratch
52/53 and uses 0102, not the external RAM. Enemy HP writes actor HP bytes;
prices write itemizer-owned merchant sale records. None owns 60F0/60F1.
CLI tests cover all 32 optional combinations in both world modes, enforce the
existing reservation collision checks and retain the ordinary-output hashes.
The external CV2 implementation separately checks its gameplay hook ranges.
These checks do not establish all-seed or full-game playability.

Run focused tests with:

```text
node node_modules/mocha/bin/mocha test/external-patch-space*.test.js
```

The external tornado implementation lives separately in kwende's cv2 project.
It is not bundled in this reservation facility. Live combination validation
belongs to that external implementation.
