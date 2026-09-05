"use client";
import useGetEvent from "@/app/components/hooks/admin/getEvent";
import { EventInterface } from "@/app/components/interfaces/event";
import { SessionInterface } from "@/app/components/interfaces/session";
import AdminLayout from "@/app/components/layouts/admin/adminLayout";
import EventCard from "@/app/components/ui/admin/eventCard";
import toDate from "@/app/components/utils/toDate";
import { useSession } from "next-auth/react";
import React from "react";

export default function EventView() {
  const { data, error } = useGetEvent();
  const { data: sessionData } = useSession();
  const session: SessionInterface = sessionData as SessionInterface;

  return (
    <AdminLayout isFixHeight name={session?.user?.name}>
      <section className="px-4 h-full mt-16 max-w-4xl mx-auto space-y-4">
        {!error &&
          data?.map((item: EventInterface) => (
            <React.Fragment key={item.id}>
              <EventCard
                keyId={item.id}
                id={item.id}
                date={toDate(item.timestamp)}
                title={item.title}
                description={item.description}
                src={item.src}
                ticket={item.ticket}
              />
            </React.Fragment>
          ))}
      </section>
    </AdminLayout>
  );
}
