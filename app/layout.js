import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import '../src/index.css'
import '../src/App.css'

export const metadata = {
  title: 'colcal',
  description: 'Collaborative Calendar Application',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <head>
          <link rel="icon" type="image/svg+xml" href="/vite.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#0a0a0a" />
          <link 
            href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=Rajdhani:wght@400;600&display=swap" 
            rel="stylesheet"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
