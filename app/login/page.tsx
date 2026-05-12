import { RootPageClient } from "../root-page-client"

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const nextValue = resolvedSearchParams?.next
  const nextUrl = Array.isArray(nextValue) ? nextValue[0] : nextValue

  return <RootPageClient nextUrl={nextUrl || null} />
}
