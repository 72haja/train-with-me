"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@apis/supabase/server";

export async function updateEmail(formData: FormData) {
    const supabase = await getServerSupabaseClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth/signin?error=Unauthorized");
    }

    const newEmail = formData.get("email") as string;

    if (!newEmail || typeof newEmail !== "string") {
        redirect("/profile?error=Email is required");
    }

    const { error } = await supabase.auth.updateUser({
        email: newEmail,
    });

    if (error) {
        redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/profile");
    redirect("/profile?success=Email updated successfully");
}

export async function updatePassword(formData: FormData) {
    const supabase = await getServerSupabaseClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth/signin?error=Unauthorized");
    }

    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 6) {
        redirect("/profile?error=Password must be at least 6 characters");
    }

    if (newPassword !== confirmPassword) {
        redirect("/profile?error=Passwords do not match");
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/profile");
    redirect("/profile?success=Password updated successfully");
}

export async function updateProfile(formData: FormData) {
    const supabase = await getServerSupabaseClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/auth/signin?error=Unauthorized");
    }

    const fullName = formData.get("fullName") as string;
    const avatarUrl = formData.get("avatarUrl") as string;

    // Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
        data: {
            full_name: fullName,
            avatar_url: avatarUrl || null,
        },
    });

    if (metadataError) {
        redirect(`/profile?error=${encodeURIComponent(metadataError.message)}`);
    }

    // Update profile table
    const { error: profileError } = await supabase.from("profiles").upsert(
        {
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "id",
        }
    );

    if (profileError) {
        console.error("Error updating profile:", profileError);
        // Don't redirect on profile error, metadata update succeeded
    }

    revalidatePath("/profile");
    redirect("/profile?success=Profile updated successfully");
}
