import { HttpError } from '../../utils/http.js'
import { UserRepository } from './user.repository.js'

export class UserService {
  static async profile(userId: string) {
    const user = await UserRepository.findProfile(userId)
    if (!user) throw new HttpError(404, 'User not found')
    return user
  }
}
