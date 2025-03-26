import { AuthTest } from "@/components/auth-test"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthTestPage() {
  return (
    <div className="min-h-screen p-4 bg-muted/40">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Supabase Authentication Test</h1>

        <AuthTest />

        <div className="flex justify-center mt-8">
          <Button asChild variant="outline">
            <Link href="/test">Back to Test Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

