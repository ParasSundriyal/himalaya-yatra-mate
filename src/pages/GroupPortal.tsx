import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Download,
  Mail,
  Phone,
  IdCard,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

const GroupPortal = () => {
  const [groupMembers, setGroupMembers] = useState([
    { id: "TG001", name: "Ramesh Kumar", email: "ramesh@example.com", phone: "+91 98765 43210", status: "Active" },
    { id: "TG002", name: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43211", status: "Active" },
    { id: "TG003", name: "Amit Patel", email: "amit@example.com", phone: "+91 98765 43212", status: "Active" },
  ]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Group Instructor Portal</h1>
          <p className="text-muted-foreground">
            Manage group registrations and member passes efficiently
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Active Passes</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <IdCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add New Member Form */}
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add New Member
            </h2>

            <form className="space-y-4">
              <div>
                <Label htmlFor="memberName">Full Name</Label>
                <Input id="memberName" placeholder="Enter full name" className="mt-2" />
              </div>

              <div>
                <Label htmlFor="memberEmail">Email Address</Label>
                <Input id="memberEmail" type="email" placeholder="email@example.com" className="mt-2" />
              </div>

              <div>
                <Label htmlFor="memberPhone">Phone Number</Label>
                <Input id="memberPhone" placeholder="+91 XXXXX XXXXX" className="mt-2" />
              </div>

              <div>
                <Label htmlFor="memberAadhar">Aadhar Number</Label>
                <Input id="memberAadhar" placeholder="XXXX XXXX XXXX" className="mt-2" />
              </div>

              <Button className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add to Group
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">
                Upon registration, members will receive:
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Unique User ID</li>
                <li>• Secure Password</li>
                <li>• Digital Pass (QR Code)</li>
                <li>• Email confirmation</li>
              </ul>
            </div>
          </Card>

          {/* Members List */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Group Members
              </h2>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>

            <div className="space-y-4">
              {groupMembers.map((member) => (
                <Card key={member.id} className="p-5 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            ID: {member.id}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2" />
                          {member.email}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          {member.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Badge className="bg-secondary text-secondary-foreground">
                        {member.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Pass
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {groupMembers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No members added yet</p>
                <p className="text-sm">Start by adding your first group member</p>
              </div>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3">Group Instructor Guide</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Register as a group instructor to manage multiple tourist registrations</p>
            <p>• Add members with their details to auto-generate unique credentials</p>
            <p>• Export group details and passes as PDF for offline access</p>
            <p>• Manage bookings for hotels, taxis, and parking for the entire group</p>
            <p>• Track all member activities from a centralized dashboard</p>
            <p className="text-primary font-medium mt-4">Enable Lovable Cloud to activate authentication and member management features</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GroupPortal;
