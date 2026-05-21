from pathlib import Path
import re

route_dir = Path('routes')
tag_map = {
    'auth.routes.js': ('Auth', 'Authentication management'),
    'booking.routes.js': ('Bookings', 'Booking management'),
    'hotel.routes.js': ('Hotels', 'Hotel booking and management'),
    'parking.routes.js': ('Parking', 'Parking area and booking management'),
    'taxi.routes.js': ('Taxis', 'Taxi booking and management'),
    'hourlyPass.routes.js': ('Hourly Passes', 'Hourly checkpoint passes management'),
    'admin.routes.js': ('Admin', 'Admin dashboard and management operations'),
    'group.routes.js': ('Groups', 'Group management for instructors and members'),
    'checkpoint.routes.js': ('Checkpoints', 'Checkpoint management'),
    'chatbot.routes.js': ('Chatbot', 'Multilingual smart chatbot responses'),
    'aiDetection.routes.js': ('AI Detection', 'AI-based vehicle detection and logging'),
    'dashboard.routes.js': ('Dashboard', 'Live dashboard data and statistics'),
    'crowd.routes.js': ('Crowd', 'Real-time crowd data and predictions'),
    'location.routes.js': ('Location', 'User location tracking and geofencing'),
    'passes.routes.js': ('Passes', 'Dham pass management and quotas'),
    'registration.routes.js': ('Registration', 'User registration and profile completion'),
    'itinerary.routes.js': ('Itinerary', 'Itinerary planning and generation'),
    'maps.js': ('Maps', 'Offline maps and tile management'),
}

route_files = sorted([p for p in route_dir.glob('*.js') if p.name != 'itinerary.js'])

for path in route_files:
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    changed = False
    tagname, tagdesc = tag_map.get(path.name, (path.stem.title(), path.stem.title()))
    has_tag = any('tags:' in line and '@swagger' in ''.join(lines[max(0, i-3):i+1]) for i, line in enumerate(lines))
    if not has_tag:
        for i, line in enumerate(lines):
            if re.match(r'const router = express\.Router\(\);', line):
                insert = [line, '', '/**', ' * @swagger', ' * tags:', f' *   - name: {tagname}', f' *     description: {tagdesc}', ' */']
                lines[i:i+1] = insert
                changed = True
                break
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith('// @route'):
            pre = ''.join(lines[max(0, i-8):i])
            if '@swagger' in pre:
                i += 1
                continue
            route_line = line.strip()[len('// @route'):].strip()
            m = re.match(r'([A-Z]+)\s+(/\S+)', route_line)
            if not m:
                i += 1
                continue
            method, path_str = m.group(1), m.group(2)
            desc = ''
            for j in range(i+1, min(len(lines), i+6)):
                if lines[j].strip().startswith('// @desc'):
                    desc = lines[j].strip()[len('// @desc'):].strip()
                    break
            if not desc:
                desc = f'{method} {path_str}'
            protected = False
            optional = False
            for j in range(i+1, min(len(lines), i+10)):
                if 'authenticate' in lines[j] or 'authorize' in lines[j]:
                    protected = True
                    break
                if 'optionalAuth' in lines[j]:
                    optional = True
            if 'Private' in line or 'Private' in desc or protected:
                protected = True
            if optional:
                protected = False
            request_body = method in ('POST', 'PUT', 'PATCH')
            path_params = re.findall(r':(\w+)', path_str)
            block = ['/**', ' * @swagger', f' * {path_str}:', f' *   {method.lower()}:', f' *     summary: {desc}', f' *     tags: [{tagname}]']
            if protected:
                block.append(' *     security:')
                block.append(' *       - bearerAuth: []')
            if path_params:
                block.append(' *     parameters:')
                for param in path_params:
                    block.append(' *       - in: path')
                    block.append(f' *         name: {param}')
                    block.append(' *         required: true')
                    block.append(' *         schema:')
                    block.append(' *           type: string')
            if request_body:
                block.extend([' *     requestBody:', ' *       required: true', ' *       content:', ' *         application/json:', ' *           schema:', ' *             type: object', ' *             properties:'])
                block.append(' *               exampleField:')
                block.append(' *                 type: string')
            block.extend([' *     responses:', ' *       200:', ' *         description: Successful response', ' *       400:', ' *         description: Bad request', ' *       500:', ' *         description: Server error', ' */'])
            lines[i:i] = block
            i += len(block)
            changed = True
        i += 1
    if changed:
        path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
        print('Updated', path.name)
