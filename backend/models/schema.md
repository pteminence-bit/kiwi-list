1. Users Collection (/users/{uid})

uid: String (Firebase Auth ID)

walletBalance: Number (Current balance in Naira)

role: String ("user" or "admin")

totalEarned: Number (Lifetime earnings from contact unlocks)

2. Listings Collection (/listings/{listingId})

ownerId: String (UID of the poster)

tier: String ("free" or "premium")

price: Number (Property price)

images: Array (2-4 URLs from Cloudflare R2)

contactDetails: Map (Phone/Email - hidden from frontend if tier is premium and not paid for)

isFlagged: Boolean (Default: false)

unlockCount: Number (How many times this premium post was unlocked)

3. Transactions Collection (/transactions/{txId})

buyerId: String

sellerId: String (Owner of the post)

amount: Number (500 or 3000)

type: String ("post_fee" or "contact_unlock")

status: String ("pending", "completed")