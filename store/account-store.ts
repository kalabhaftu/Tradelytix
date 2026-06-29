import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { type InferSelectModel } from 'drizzle-orm'
import { Account as schemaAccount } from '@/lib/db/schema'

type Account = InferSelectModel<typeof schemaAccount>

interface AccountStore {
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  updateAccount: (accountNumber: string, updates: Partial<Account>) => void
  deleteAccount: (accountNumber: string) => void
  addAccount: (account: Account) => void
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      accounts: [],
      setAccounts: (accounts) => set({ accounts }),
      updateAccount: (accountNumber, updates) => 
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.number === accountNumber
              ? { ...account, ...updates }
              : account
          ),
        })),
      deleteAccount: (accountNumber) =>
        set((state) => ({
          accounts: state.accounts.filter(
            (account) => account.number !== accountNumber
          ),
        })),
      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, account],
        })),
    }),
    {
      name: "accounts-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
) 