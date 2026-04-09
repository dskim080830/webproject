import { serialize } from 'cookie';

export default function handler(req, res) {
    const cookie = serialize('auth_token', '', {
        maxAge: -1,
        path: '/'
    });
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ message: 'Logged out' });
}
