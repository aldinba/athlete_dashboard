import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentActivities() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Morning Run</p>
          <p className="text-sm text-muted-foreground">Today · 8.2 km · 42:15</p>
        </div>
        <div className="ml-auto font-medium">5:09 /km</div>
      </div>
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Interval Training</p>
          <p className="text-sm text-muted-foreground">Yesterday · 5.5 km · 28:30</p>
        </div>
        <div className="ml-auto font-medium">5:11 /km</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Long Run</p>
          <p className="text-sm text-muted-foreground">Mar 19, 2025 · 15.3 km · 1:21:45</p>
        </div>
        <div className="ml-auto font-medium">5:20 /km</div>
      </div>
    </div>
  )
}

