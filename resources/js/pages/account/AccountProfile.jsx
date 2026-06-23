import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import ProfileForm from '../../components/account/ProfileForm';

export default function AccountProfile() {
    const { user } = useAuth();

    return (
        <div>
            <ProfileForm user={user} />
        </div>
    );
}
