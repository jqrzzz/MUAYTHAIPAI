"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Camera, X, Plus, ToggleLeft, ToggleRight, Save } from "lucide-react"
import Image from "next/image"

interface TrainerProfile {
  id: string
  user_id: string
  display_name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  photos: string[]
  is_available: boolean
  availability_note: string | null
  years_experience: number | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
  specialties: string[] | null
  open_to_fights: boolean
  open_to_events: boolean
}

export default function ProfileTab() {
  const [myProfile, setMyProfile] = useState<TrainerProfile | null>(null)
  const [myProfileLoading, setMyProfileLoading] = useState(false)
  const [myProfileSaving, setMyProfileSaving] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  const [myProfileForm, setMyProfileForm] = useState({
    display_name: "",
    title: "",
    bio: "",
    specialties: "",
    photo_url: "",
    photos: [] as string[],
    is_available: true,
    availability_note: "",
    years_experience: 0,
    fight_record_wins: 0,
    fight_record_losses: 0,
    fight_record_draws: 0,
    open_to_fights: false,
    open_to_events: false,
  })

  useEffect(() => {
    fetchMyProfile()
  }, [])

  const fetchMyProfile = async () => {
    setMyProfileLoading(true)
    try {
      const response = await fetch("/api/trainer/profile")
      const data = await response.json()
      if (data.profile) {
        setMyProfile(data.profile)
        setMyProfileForm({
          display_name: data.profile.display_name || "",
          title: data.profile.title || "",
          bio: data.profile.bio || "",
          specialties: data.profile.specialties?.join(", ") || "",
          photo_url: data.profile.photo_url || "",
          photos: data.profile.photos || [],
          is_available: data.profile.is_available ?? true,
          availability_note: data.profile.availability_note || "",
          years_experience: data.profile.years_experience || 0,
          fight_record_wins: data.profile.fight_record_wins || 0,
          fight_record_losses: data.profile.fight_record_losses || 0,
          fight_record_draws: data.profile.fight_record_draws || 0,
          open_to_fights: data.profile.open_to_fights ?? false,
          open_to_events: data.profile.open_to_events ?? false,
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setMyProfileLoading(false)
    }
  }

  const saveMyProfile = async () => {
    setMyProfileSaving(true)
    try {
      const response = await fetch("/api/trainer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: myProfileForm.display_name,
          title: myProfileForm.title,
          bio: myProfileForm.bio,
          specialties: myProfileForm.specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          photo_url: myProfileForm.photos[0] || myProfileForm.photo_url,
          photos: myProfileForm.photos,
          is_available: myProfileForm.is_available,
          availability_note: myProfileForm.availability_note,
          years_experience: myProfileForm.years_experience,
          fight_record_wins: myProfileForm.fight_record_wins,
          fight_record_losses: myProfileForm.fight_record_losses,
          fight_record_draws: myProfileForm.fight_record_draws,
          open_to_fights: myProfileForm.open_to_fights,
          open_to_events: myProfileForm.open_to_events,
        }),
      })
      if (response.ok) {
        await fetchMyProfile()
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setMyProfileSaving(false)
    }
  }

  const addPhoto = () => {
    if (newPhotoUrl && myProfileForm.photos.length < 5) {
      setMyProfileForm({
        ...myProfileForm,
        photos: [...myProfileForm.photos, newPhotoUrl],
      })
      setNewPhotoUrl("")
    }
  }

  const removePhoto = (index: number) => {
    setMyProfileForm({
      ...myProfileForm,
      photos: myProfileForm.photos.filter((_, i) => i !== index),
    })
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" /> My Profile
        </CardTitle>
        <CardDescription>Update your trainer profile</CardDescription>
      </CardHeader>
      <CardContent>
        {myProfileLoading ? (
          <div className="text-center py-8 text-neutral-400">Loading...</div>
        ) : !myProfile ? (
          <div className="text-center py-8 text-neutral-400">
            No trainer profile found. Contact admin to set up your profile.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photos Section */}
            <div>
              <Label className="text-white mb-2 block">Photos - Max 5</Label>
              <div className="flex flex-wrap gap-3 mb-3">
                {myProfileForm.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded-lg border border-neutral-700"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {myProfileForm.photos.length < 5 && (
                  <div className="w-24 h-24 border-2 border-dashed border-neutral-700 rounded-lg flex items-center justify-center">
                    <Camera className="w-8 h-8 text-neutral-600" />
                  </div>
                )}
              </div>
              {myProfileForm.photos.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <Button onClick={addPhoto} variant="outline" className="border-neutral-700 bg-transparent">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Display Name</Label>
                <Input
                  value={myProfileForm.display_name}
                  onChange={(e) => setMyProfileForm({ ...myProfileForm, display_name: e.target.value })}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Title</Label>
                <Input
                  value={myProfileForm.title}
                  onChange={(e) => setMyProfileForm({ ...myProfileForm, title: e.target.value })}
                  placeholder="e.g. Head Trainer, Boxing Coach"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Bio</Label>
              <Textarea
                value={myProfileForm.bio}
                onChange={(e) => setMyProfileForm({ ...myProfileForm, bio: e.target.value })}
                placeholder="Tell students about yourself..."
                className="bg-neutral-800 border-neutral-700 text-white"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-white">Specialties</Label>
              <Input
                value={myProfileForm.specialties}
                onChange={(e) => setMyProfileForm({ ...myProfileForm, specialties: e.target.value })}
                placeholder="Clinch, Elbows, Pad Work (comma separated)"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            {/* Experience & Record */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-white">Years Exp.</Label>
                <Input
                  type="number"
                  value={myProfileForm.years_experience}
                  onChange={(e) =>
                    setMyProfileForm({ ...myProfileForm, years_experience: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Wins</Label>
                <Input
                  type="number"
                  value={myProfileForm.fight_record_wins}
                  onChange={(e) =>
                    setMyProfileForm({ ...myProfileForm, fight_record_wins: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Losses</Label>
                <Input
                  type="number"
                  value={myProfileForm.fight_record_losses}
                  onChange={(e) =>
                    setMyProfileForm({ ...myProfileForm, fight_record_losses: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Draws</Label>
                <Input
                  type="number"
                  value={myProfileForm.fight_record_draws}
                  onChange={(e) =>
                    setMyProfileForm({ ...myProfileForm, fight_record_draws: Number.parseInt(e.target.value) || 0 })
                  }
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setMyProfileForm({ ...myProfileForm, is_available: !myProfileForm.is_available })
                  }
                  className={`p-2 rounded ${myProfileForm.is_available ? "bg-green-600" : "bg-neutral-700"}`}
                >
                  {myProfileForm.is_available ? (
                    <ToggleRight className="w-5 h-5" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
                <span className="text-white">
                  {myProfileForm.is_available ? "Available" : "Not Available"}
                </span>
              </div>
              <Input
                value={myProfileForm.availability_note}
                onChange={(e) => setMyProfileForm({ ...myProfileForm, availability_note: e.target.value })}
                placeholder="Availability note (e.g. Back next week)"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            {/* Ock Ock Options */}
            <div className="space-y-3">
              <Label className="text-white">Ock Ock Options</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={myProfileForm.open_to_fights}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, open_to_fights: e.target.checked })}
                    className="rounded"
                  />
                  Open to Fights
                </label>
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={myProfileForm.open_to_events}
                    onChange={(e) => setMyProfileForm({ ...myProfileForm, open_to_events: e.target.checked })}
                    className="rounded"
                  />
                  Open to Events
                </label>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={saveMyProfile}
              disabled={myProfileSaving}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {myProfileSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
