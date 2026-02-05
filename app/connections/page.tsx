import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ConnectionsContent } from "@/app/connections/connections-content";
import { createServerSupabaseClient } from "@apis/supabase/server";
import styles from "./page.module.scss";

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function ConnectionsLoading() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link href="/" className={styles.backButton} aria-label="Go back">
                        <ArrowLeft className={styles.backButtonIcon} />
                    </Link>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.headerTitle}>Available trains</h1>
                        <p className={styles.headerSubtitle}>Loading…</p>
                    </div>
                    <div className={styles.headerFavoriteButton} aria-hidden />
                </div>
            </header>
            <main className={styles.main}>
                <div
                    className={styles.skeletonList}
                    aria-busy="true"
                    aria-label="Loading connections">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonBadge} />
                            <div className={styles.skeletonContent}>
                                <div
                                    className={`${styles.skeletonLine} ${styles.skeletonLineLong}`}
                                />
                                <div
                                    className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

async function ConnectionsPageInner({ searchParams }: PageProps) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth/signin");
    }

    const params = await searchParams;
    const originId = typeof params.origin === "string" ? params.origin : null;
    const destinationId = typeof params.destination === "string" ? params.destination : null;
    const date = typeof params.date === "string" ? params.date : null;
    const time = typeof params.time === "string" ? params.time : null;

    if (!originId || !destinationId || !date || !time) {
        redirect("/");
    }

    return (
        <ConnectionsContent
            initialConnections={[]}
            initialFavorites={[]}
            searchParams={{
                originId,
                destinationId,
                date,
                time,
            }}
        />
    );
}

/**
 * Connections search results page (Server Component).
 * Server only does auth + params; connections/favorites load on the client with skeletons.
 */
export default function ConnectionsPage(props: PageProps) {
    return (
        <Suspense fallback={<ConnectionsLoading />}>
            <ConnectionsPageInner searchParams={props.searchParams} />
        </Suspense>
    );
}
