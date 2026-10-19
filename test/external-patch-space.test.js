const assert = require('assert');
const space = require('../lib/external-patch-space');

describe('external patch space contract', function() {
	it('bounds both allocators and rejects unsupported combinations', function() {
		const banks = Array.from({length: 8}, () => ({ram: {}, rom: {}}));
		space.configure(banks, [{id: 'map-rando'}]);
		assert.equal(banks[1].ram.end, 0xBD00);
		assert.equal(banks[7].ram.end, 0xFF80);
		assert.throws(() => space.configure(banks, [{id: 'tornado-rando'}]));
		assert.throws(() => space.configure(banks, [{id: 'town-rando'}, {id: 'map-rando'}]));
		assert.throws(() => space.configure(banks, [{id: 'town-rando'}, {id: 'fast-lakes'}]));
		assert.throws(() => space.configure(banks, [{id: '100-hearts'}]));
		assert.throws(() => space.configure(banks, [{id: 'town-rando'}, {id: '100-hearts'}, {id: '100-hearts'}]));
	});
	it('accepts either world with every audited randomization and quality-of-life combination', function() {
		const optional = ['100-hearts', 'penalty-reduction', 'enemizer', 'enemy-hp', 'price-rando'];
		for (const world of ['town-rando', 'map-rando']) for (let mask = 0; mask < 32; mask++) {
			const ids = [world];
			optional.forEach((id, bit) => { if (mask & (1 << bit)) ids.push(id); });
			const banks = Array.from({length: 8}, () => ({ram: {}, rom: {}}));
			space.configure(banks, ids.map(id => ({id})));
			assert.equal(banks[1].ram.end, 0xBD00);
			assert.equal(banks[7].ram.end, 0xFF80);
		}
	});
	it('rejects direct and copy writes into either reservation', function() {
		for (const op of [{32016: [1]}, {32: ['copy', 2, 32016]}, {130960: [1]}]) {
			assert.throws(() => space.finalize({export: () => [op]}));
		}
	});
	it('clears both reservations only after preflight and exports RAM ownership', function() {
		const writes = [];
		const contract = space.finalize({export: () => [], core: {add: (bytes, offset) => writes.push({bytes, offset})}});
		assert.equal(writes.length, 2);
		assert.equal(writes[0].bytes.length, 512);
		assert(writes.every(w => w.bytes.every(b => b === 255)));
		assert.equal(contract.ram.cpuAddress, 0x60F0);
	});
});
