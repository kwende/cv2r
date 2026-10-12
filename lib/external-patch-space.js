// Compatibility space for a later, independently owned patch. No gameplay code.
const ranges = [
	{ bank: 1, cpuAddress: 0xBD00, fileOffset: 0x7D10, length: 0x200 },
	{ bank: 7, cpuAddress: 0xFF80, fileOffset: 0x1FF90, length: 0x60 }
];
const contract = {
	schemaVersion: 1, profile: 'cv2-external-v1', prg: ranges,
	ram: { cpuAddress: 0x60F0, length: 2, initialization: 'zero at full startup only' }
};

function configure(bank, patches) {
	const ids = patches.map(patch => patch.id);
	const worlds = ids.filter(id => ['town-rando', 'map-rando'].includes(id));
	const supported = ['town-rando', 'map-rando', '100-hearts', 'penalty-reduction'];
	if (worlds.length !== 1 || new Set(ids).size !== ids.length || ids.some(id => !supported.includes(id))) {
		throw new Error('External patch space requires one Town/Map mode; only 100% hearts and Penalty Reduction may be added.');
	}
	bank[1].ram.end = 0xBD00;
	bank[1].rom.end = 0x7D10;
	bank[7].ram.end = 0xFF80;
	bank[7].rom.end = 0x1FF90;
}

function finalize(pm) {
	// Catch literal writes/copies as well as allocator use before exposing space.
	for (const op of pm.export()) {
		for (const [offsetText, bytes] of Object.entries(op)) {
			const start = bytes[0] === 'copy' ? bytes[2] : Number(offsetText);
			const length = bytes[0] === 'copy' ? bytes[1] : bytes.length;
			if (ranges.some(r => start < r.fileOffset + r.length && start + length > r.fileOffset)) {
				throw new Error('CV2R operation overlaps reserved external patch space.');
			}
		}
	}
	// bank7expansion has moved RESET and updated its vector before this fill.
	for (const range of ranges) pm.core.add(Array(range.length).fill(0xFF), range.fileOffset);
	return contract;
}

module.exports = { configure, finalize, contract };
