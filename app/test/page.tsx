import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TestPage() {
  return (
    <div className="min-h-screen p-4 bg-muted/40">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Supabase Integration Tests</h1>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Environment Variables Check</CardTitle>
            <CardDescription>Make sure your environment variables are properly set</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Before running the tests, make sure you have set the following environment variables:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <code className="font-mono bg-muted p-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>
              </li>
              <li>
                <code className="font-mono bg-muted p-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              These variables should be set in your <code className="font-mono">.env.local</code> file or in your Vercel
              project settings.
            </p>

            <div className="flex justify-center mt-6">
              <Button asChild>
                <Link href="/test/connection">Continue to Tests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

