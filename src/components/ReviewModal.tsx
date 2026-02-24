import { useState } from 'react'
import { Modal, Stack, Text, Rating, Textarea, Button, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { submitReview } from '../services/reviews'

interface ReviewModalProps {
    opened: boolean
    onClose: () => void
    bookingId: string
    clientId: string
    clientName: string
    stylistId: string
    onSuccess: () => void
}

export function ReviewModal({
    opened,
    onClose,
    bookingId,
    clientId,
    clientName,
    stylistId,
    onSuccess,
}: ReviewModalProps) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            notifications.show({ color: 'red', message: 'Please select a rating' })
            return
        }

        setSubmitting(true)
        try {
            await submitReview({
                bookingId,
                clientId,
                clientName,
                stylistId,
                rating,
                comment: comment.trim(),
            })
            notifications.show({ color: 'green', title: 'Review submitted', message: 'Thank you for your feedback!' })
            onSuccess()
            onClose()
        } catch (err: any) {
            notifications.show({ color: 'red', title: 'Error', message: err.message || 'Could not submit review' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal opened={opened} onClose={onClose} title="Leave a review" radius="lg">
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    How was your appointment? Your feedback helps other clients find great stylists.
                </Text>

                <Stack align="center" gap={4}>
                    <Text fw={700}>Rating</Text>
                    <Rating value={rating} onChange={setRating} size="xl" />
                </Stack>

                <Textarea
                    label="Your review"
                    placeholder="Share your experience..."
                    minRows={3}
                    value={comment}
                    onChange={(e) => setComment(e.currentTarget.value)}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onClose} radius="xl">Cancel</Button>
                    <Button color="crown" radius="xl" loading={submitting} onClick={handleSubmit}>
                        Submit Review
                    </Button>
                </Group>
            </Stack>
        </Modal>
    )
}
