import { User, UserType } from '../../user/entities/user.entity';

export const mockUser: User = {
  email: 'tester@example.com',
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  phone: '+1234567890',
  id: 'some-uuid-value-here',
  attempts_left: 2,
  created_at: new Date(),
  updated_at: new Date(),
  user_type: UserType.ADMIN,
  backup_codes: [],
  owned_organisations: [],
  created_organisations: [],
  jobs: [],
  comments: [],
  hashPassword: () => null,
  password: 'password123',
  time_left: 5,
  secret: 'secret',
  is_2fa_enabled: true,
  testimonials: [],
  profile: null,
  organisationMembers: [],
  notification_settings: [],
  notifications: [],
};
