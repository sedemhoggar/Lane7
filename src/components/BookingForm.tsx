import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  _id?: string;
  eventId?: string;
  venue?: string;
  currency?: string;
  note?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  startTime?: string;
  endTime?: string;
  activities?: string[];
  numberOfPeople?: number;
}

const BookingForm = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<UserData>({});
  const { toast } = useToast();

  const activities = ['Bowling', 'Beer Pong', 'Pool'];

  // Get token from URL parameters
  const getTokenFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  };

  // Build API URL with dynamic token
  const getAPIURL = (token: string) => {
    return `https://asamfel.app.n8n.cloud/webhook/get-user-token?token=${token}`;
  };

  // Format date to datetime-local format
  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getTokenFromURL();
        
        if (!token) {
          setError('Invalid or missing token. Please provide a valid token in the URL.');
          setLoading(false);
          return;
        }

        const apiUrl = getAPIURL(token);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if user has already confirmed their details
        if (data.result && data.result === "You've already confirmed your details") {
          setSuccess("You've already confirmed your details. No further action is needed.");
          setLoading(false);
          return;
        }

        const user = data.user || data;
        setFormData({
          ...user,
          startTime: formatDateTimeLocal(user.startTime),
          endTime: formatDateTimeLocal(user.endTime),
          activities: user.activities || []
        });
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Invalid token or failed to load user data. Please check your token and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle activity checkbox changes
  const handleActivityChange = (activity: string, checked: boolean) => {
    const currentActivities = formData.activities || [];
    const updatedActivities = checked 
      ? [...currentActivities, activity]
      : currentActivities.filter(a => a !== activity);
    
    handleInputChange('activities', updatedActivities);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'activities') {
          submitData.append(key, JSON.stringify(value || []));
        } else {
          submitData.append(key, String(value || ''));
        }
      });

      const response = await fetch('https://asamfel.app.n8n.cloud/webhook/confirm-booking-details', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess('Form submitted successfully!');
      toast({
        title: "Success",
        description: "Your booking details have been confirmed successfully!",
      });
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit form. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading your information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-card border-border/50">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Booking Confirmation Form
          </CardTitle>
          <p className="text-muted-foreground">
            Please review and confirm your booking details
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-success bg-success/10 text-success-foreground">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">{success}</AlertDescription>
            </Alert>
          )}

          {!success && !error && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime || ''}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime || ''}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Activities</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activities.map((activity) => (
                    <div key={activity} className="flex items-center space-x-2">
                      <Checkbox
                        id={activity.toLowerCase().replace(' ', '-')}
                        checked={(formData.activities || []).includes(activity)}
                        onCheckedChange={(checked) => handleActivityChange(activity, !!checked)}
                      />
                      <Label
                        htmlFor={activity.toLowerCase().replace(' ', '-')}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {activity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  value={formData.numberOfPeople || ''}
                  onChange={(e) => handleInputChange('numberOfPeople', parseInt(e.target.value) || '')}
                  required
                  className="bg-input border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Changes'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingForm;