"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBell,
  faEye,
  faEyeSlash,
  faKey,
  faLock,
  faShield,
  faSignOut,
  faUser,
  faUserPen,
} from "@fortawesome/free-solid-svg-icons";
import { AUTH_SESSION_KEY } from "@/app/components/AuthGate";

type SessionProfile = {
  name: string;
  email: string;
  role: "guru" | "siswa";
};

type NotificationPreference = {
  emailNotifications: boolean;
  activityUpdates: boolean;
  securityAlerts: boolean;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [activeSection, setActiveSection] = useState<"overview" | "settings" | "security" | "notifications">("overview");
  const [showPassword, setShowPassword] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference>({
    emailNotifications: true,
    activityUpdates: true,
    securityAlerts: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(AUTH_SESSION_KEY);
      if (!stored) {
        setProfile(null);
        return;
      }
      const parsed = JSON.parse(stored) as SessionProfile;
      setProfile(parsed);
      setEditName(parsed.name);
    } catch {
      setProfile(null);
    }

    // Load notification preferences
    const savedPrefs = window.localStorage.getItem("notification-prefs");
    if (savedPrefs) {
      try {
        setNotificationPrefs(JSON.parse(savedPrefs));
      } catch {
        // Use default prefs
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      setProfile(null);
      setStatusMessage("Berhasil logout dari akun saat ini.");
      setStatusType("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  };

  const handleSaveName = () => {
    if (!editName.trim()) {
      setStatusMessage("Nama tidak boleh kosong.");
      setStatusType("error");
      return;
    }

    if (profile) {
      const updatedProfile = { ...profile, name: editName };
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditing(false);
      setStatusMessage("Nama profil berhasil diperbarui.");
      setStatusType("success");
    }
  };

  const handleSaveNotifications = () => {
    window.localStorage.setItem("notification-prefs", JSON.stringify(notificationPrefs));
    setStatusMessage("Preferensi notifikasi berhasil disimpan.");
    setStatusType("success");
  };

  const roleLabel = profile?.role === "guru" ? "Guru Pengampu" : profile?.role === "siswa" ? "Peserta Didik" : "Belum login";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
            <FontAwesomeIcon icon={faArrowLeft} />
            Kembali ke kelas
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <div className="space-y-3">
            <button
              onClick={() => setActiveSection("overview")}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === "overview" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              Profil Saya
            </button>
            <button
              onClick={() => setActiveSection("settings")}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === "settings" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <FontAwesomeIcon icon={faUserPen} className="mr-2" />
              Edit Profil
            </button>
            <button
              onClick={() => setActiveSection("notifications")}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === "notifications" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <FontAwesomeIcon icon={faBell} className="mr-2" />
              Notifikasi
            </button>
            <button
              onClick={() => setActiveSection("security")}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === "security" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <FontAwesomeIcon icon={faShield} className="mr-2" />
              Keamanan
            </button>
            <div className="border-t border-slate-200 dark:border-slate-800" />
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl border border-rose-200 px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <FontAwesomeIcon icon={faSignOut} className="mr-2" />
              Logout
            </button>
          </div>

          {/* Main Content */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            {statusMessage && (
              <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${statusType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                {statusMessage}
              </div>
            )}

            {/* Overview Section */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-indigo-500">Profil Saya</p>
                  <h1 className="mt-2 text-3xl font-black">Informasi Akun</h1>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-2xl font-black text-white">
                      {profile?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">{profile?.name ?? "Pengguna belum login"}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email ?? "-"}</p>
                      <div className="mt-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                        {roleLabel}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Email</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{profile?.email ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Peran</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{roleLabel}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Profile Section */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-indigo-500">Edit Profil</p>
                  <h1 className="mt-2 text-3xl font-black">Ubah Informasi Akun</h1>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={!isEditing}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email (Tidak dapat diubah)</label>
                    <input type="email" value={profile?.email ?? ""} disabled className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Peran (Tidak dapat diubah)</label>
                    <input type="text" value={roleLabel} disabled className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="rounded-2xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600">
                      <FontAwesomeIcon icon={faUserPen} className="mr-2" />
                      Edit Nama
                    </button>
                  ) : (
                    <>
                      <button onClick={handleSaveName} className="rounded-2xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600">
                        Simpan
                      </button>
                      <button onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.name ?? "");
                      }} className="rounded-2xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                        Batal
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-indigo-500">Notifikasi</p>
                  <h1 className="mt-2 text-3xl font-black">Pengaturan Notifikasi</h1>
                </div>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailNotifications}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Notifikasi Email</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Terima notifikasi penting melalui email</p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.activityUpdates}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, activityUpdates: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Update Aktivitas</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Notifikasi tentang aktivitas kelas terbaru</p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.securityAlerts}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, securityAlerts: e.target.checked })}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Alert Keamanan</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Pemberitahuan tentang aktivitas keamanan akun</p>
                    </div>
                  </label>
                </div>

                <button onClick={handleSaveNotifications} className="rounded-2xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600">
                  <FontAwesomeIcon icon={faBell} className="mr-2" />
                  Simpan Preferensi
                </button>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-indigo-500">Keamanan</p>
                  <h1 className="mt-2 text-3xl font-black">Pengaturan Keamanan</h1>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Ubah Password</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Perbarui password akun Anda secara berkala untuk keamanan lebih baik</p>
                      </div>
                      <button className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        <FontAwesomeIcon icon={faKey} className="mr-2" />
                        Ubah
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Verifikasi Dua Faktor</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tambahkan lapisan keamanan ekstra dengan verifikasi dua faktor</p>
                      </div>
                      <button className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        <FontAwesomeIcon icon={faLock} className="mr-2" />
                        Setup
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Sesi Aktif</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kelola sesi login Anda di berbagai perangkat</p>
                      </div>
                      <button className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                        Lihat Sesi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
