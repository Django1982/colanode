import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';

import { Button } from '@colanode/ui/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@colanode/ui/components/ui/form';
import { Input } from '@colanode/ui/components/ui/input';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters long.')
      .refine((value) => /[a-z]/.test(value), {
        message: 'Password must include at least one lowercase letter.',
      })
      .refine((value) => /[A-Z]/.test(value), {
        message: 'Password must include at least one uppercase letter.',
      })
      .refine((value) => /[0-9]/.test(value), {
        message: 'Password must include at least one digit.',
      })
      .refine((value) => /[^A-Za-z0-9]/.test(value), {
        message: 'Password must include at least one special character.',
      }),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }

    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'New password must be different from the current password.',
      });
    }
  });

export const AccountPasswordRotate = () => {
  const account = useAccount();
  const { mutate: rotatePassword, isPending } = useMutation();

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: z.infer<typeof passwordSchema>) => {
    if (isPending) {
      return;
    }

    rotatePassword({
      input: {
        type: 'account.password.rotate',
        accountId: account.id,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      onSuccess() {
        toast.success('Password updated. Please sign in again with your new password.');
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <Form {...form}>
      <form className="max-w-xl space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password *</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password *</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password *</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="w-40">
            {isPending && <Spinner className="mr-2" />}Rotate Password
          </Button>
        </div>
      </form>
    </Form>
  );
};
