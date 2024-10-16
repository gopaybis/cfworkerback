export default function handler(request, response) {
  response.status(200).json({ message: `Hello from ${process.env.VERCEL_REGION}` });
}
