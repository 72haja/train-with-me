import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ConnectionsContent } from "@/app/connections/connections-content";
import { convexAuthNextjsToken, isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import styles from "./page.module.scss";

type PageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ConnectionsLoading = () => {
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
};

const ConnectionsPageInner = async ({ searchParams }: PageProps) => {
    if (!(await isAuthenticatedNextjs())) {
        redirect("/auth/signin");
    }

    // Token is read here to ensure the server-rendered page is not cached across users.
    await convexAuthNextjsToken();

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
};

const ConnectionsPage = (props: PageProps) => {
    return (
        <Suspense fallback={<ConnectionsLoading />}>
            <ConnectionsPageInner searchParams={props.searchParams} />
        </Suspense>
    );
};

export default ConnectionsPage;
