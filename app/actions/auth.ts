"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSupabaseClient } from "@apis/supabase/server";

async function getEmailRedirectTo() {
    const requestHeaders = await headers();

    const origin = requestHeaders.get("origin");
    if (origin) {
        return origin;
    }

    const forwardedHost = requestHeaders.get("x-forwarded-host");
    if (forwardedHost) {
        const forwardedProto = requestHeaders.get("x-forwarded-proto") || "https";
        return `${forwardedProto}://${forwardedHost}`;
    }

    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return undefined;
}

export async function signIn(formData: FormData) {
    const supabase = await getServerSupabaseClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}

export async function signUp(formData: FormData) {
    const supabase = await getServerSupabaseClient();
    const emailRedirectTo = await getEmailRedirectTo();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo,
        },
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}

export async function signOut() {
    const supabase = await getServerSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}
