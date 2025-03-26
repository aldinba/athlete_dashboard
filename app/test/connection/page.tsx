import { SupabaseTest } from "@/components/supabase-test"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConnectionTestPage() {
  return (
    <div className="min-h-screen p-4 bg-muted/40">
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Supabase Connection Test</h1>

        <SupabaseTest />

        <div className="flex justify-center mt-8">
          <Button asChild>
            <Link href="/test/auth">Continue to Auth Test</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

