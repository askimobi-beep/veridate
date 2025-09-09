import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Phone,
  User2,
  GraduationCap,
  BriefcaseBusiness,
  MapPin,
  Mail,
} from "lucide-react";
import { initials } from "@/utils/profileUtils";

export default function DirectoryCard({ profile }) {
  const edu = profile.educationLatest;
  const exp = profile.experienceLatest;

  return (
    <Card className="hover:shadow-xl transition rounded-xl border border-gray-200">
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-orange-200">
          <AvatarImage src={profile.profilePicUrl || ""} alt={profile.name} />
          <AvatarFallback>{initials(profile.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <CardTitle className="text-base">{profile.name}</CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {profile.email || "—"}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-left">
        {" "}
        {/* ⬅ force left */}
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-rose-500" />
            <span>{profile.mobile || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4 text-violet-500" />
            <span>{profile.gender || "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-sky-600" />
            <span>
              {profile.city ? `${profile.city}` : "—"}
              {profile.country ? `, ${profile.country}` : ""}
            </span>
          </div>
        </div>
        {/* Education */}
        <div className="text-left">
          <div className="font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-amber-600" />
            <span>Education:</span>
          </div>

          {edu?.degreeTitle ? (
            <div className="mt-1">
              <Badge variant="secondary" className="rounded-md w-fit">
                {" "}
                {/* ⬅ shrink & stay left */}
                {edu.degreeTitle}
              </Badge>
            </div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">
              Not provided
            </div>
          )}
        </div>
        {/* Experience */}
        <div className="text-left">
          <div className="font-medium flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-stone-700" />
            <span>Experience:</span>
          </div>
          {exp?.jobTitle || exp?.company ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {exp?.jobTitle && (
                <Badge className="rounded-full w-fit" variant="outline">
                  {exp.jobTitle}
                </Badge>
              )}
              {exp?.company && (
                <Badge className="rounded-full w-fit" variant="outline">
                  at {exp.company}
                </Badge>
              )}
            </div>
          ) : (
            <div className="mt-1 text-xs text-muted-foreground">
              Not provided
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Link to={`/dashboard/profiles/${profile.user}`}>
          <span className="text-sm font-medium text-orange-600 hover:underline">
            View Profile →
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
