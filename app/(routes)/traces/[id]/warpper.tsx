'use client'

import TraceDetail from "@/components/traces/TraceDetail"
import { useRouter } from "next/navigation"

export function TraceDetailPageClient({id}: {id: string}) {
    const router = useRouter()
    return <TraceDetail traceId={id} onBack={() => router.push('/traces')} />
}