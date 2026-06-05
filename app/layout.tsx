import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '../components/theme-provider'

// Display: Space Grotesk — distinctive, modern, geometric headings with crisp numerals.
const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-display',
})

// Body: IBM Plex Sans — highly legible humanist body type with excellent tabular numerals
// for dense clinical data. Reads modern yet trustworthy.
const fontSans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Maternal VTE Risk Assessment Report',
  description:
    'Venous Thromboembolism risk assessment for pregnant women — North Batinah Region, Sohar Wilayate Health Centers (2023–2024).',
  generator: 'Ministry of Health, Sultanate of Oman',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontDisplay.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
