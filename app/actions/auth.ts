"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabaseClient } from "@apis/supabase/server";

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
