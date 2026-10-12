const assert = require('assert');
const {execFileSync} = require('child_process');
const {createHash} = require('crypto');
const path = require('path');

describe('external patch space CLI integration', function() {
	this.timeout(20000);
	const pinnedHashes = {
		'town-rando': '9225a4769399ec7d6ba4debeea6cce1d92dc073f7b194d78534f85276a8d55b8',
		'map-rando': 'd38d9eefe26f4caeff59bb00c0ce782dec6cd0024d3d6e7e3656366bfe540e6b'
	};
	for (const mode of Object.keys(pinnedHashes)) {
		it(`${mode} preserves ordinary output and leaves every reserved byte FF`, function() {
			const args = [path.join(__dirname, '../bin/cv2r'), '--json', '--seed', 'TornadoAudit0',
				'--logic', 'standard', '--palette', 'simons-quest', '--simon', 'simon', '--patch', mode];
			const run = extra => JSON.parse(execFileSync(process.execPath, args.concat(extra), {encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, windowsHide: true}));
			const regular = run([]);
			assert.equal(regular.externalPatchSpace, undefined);
			const normalized = regular.patch.map(op => Object.fromEntries(Object.entries(op).map(([key, bytes]) =>
				[key, bytes[0] === 'copy' ? bytes : bytes.map(b => Array.isArray(b) && b.length === 1 ? b[0] : b)])));
			assert.equal(createHash('sha256').update(JSON.stringify(normalized)).digest('hex'), pinnedHashes[mode]);
			const reserved = run(['--external-patch-space']);
			const rom = Buffer.alloc(262160);
			for (const op of reserved.patch) for (const [offset, bytes] of Object.entries(op)) {
				if (bytes[0] === 'copy') rom.copyWithin(bytes[2], Number(offset), Number(offset) + bytes[1]);
				else Buffer.from(bytes).copy(rom, Number(offset));
			}
			for (const range of reserved.externalPatchSpace.prg)
				assert(rom.subarray(range.fileOffset, range.fileOffset + range.length).every(b => b === 255));
			// RESET points outside the later fixed-bank patch reservation.
			const reset = rom.readUInt16LE(0x2000C);
			assert(reset < 0xFF80 || reset >= 0xFFE0);
		});
	}
});
