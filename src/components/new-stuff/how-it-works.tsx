import React from "react";
import { Card, CardBody, Tabs, Tab } from "@heroui/react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

export const HowItWorks = () => {
  const [selected, setSelected] = React.useState("contacts");
  
  const steps = {
    contacts: {
      title: "Contact Management",
      description: "Import or add contacts individually, organize them into groups, and use tags for better segmentation.",
      image: "https://img.heroui.chat/image/crm?w=800&h=500&u=1",
      features: [
        "Import contacts from CSV or Excel files",
        "Create custom contact fields and properties",
        "Segment contacts with tags and dynamic groups",
        "Track engagement and interaction history"
      ]
    },
    events: {
      title: "Event Creation",
      description: "Set up events with all necessary details, customize registration forms, and manage attendee information.",
      image: "https://img.heroui.chat/image/calendar?w=800&h=500&u=2",
      features: [
        "Create single or recurring events",
        "Customize registration forms and fields",
        "Set capacity limits and waitlists",
        "Manage RSVPs and attendance tracking"
      ]
    },
    reminders: {
      title: "Email Reminders",
      description: "Schedule automated email reminders to keep attendees informed about upcoming events.",
      image: "https://img.heroui.chat/image/dashboard?w=800&h=500&u=3",
      features: [
        "Set up reminder sequences with custom timing",
        "Create conditional reminders based on attendee actions",
        "Personalize reminder content for each recipient",
        "Track open rates and engagement metrics"
      ]
    },
    templates: {
      title: "Email Template Editor",
      description: "Design beautiful email templates with our drag-and-drop editor for event invitations and communications.",
      image: "https://img.heroui.chat/image/dashboard?w=800&h=500&u=4",
      features: [
        "Drag-and-drop email template builder",
        "Responsive designs that work on all devices",
        "Reusable content blocks and saved templates",
        "Dynamic content insertion for personalization"
      ]
    }
  };
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-content2">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How EventPulse Works
          </h2>
          <p className="text-lg text-foreground-600">
            Our platform makes event management simple with these powerful features.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <Tabs 
            aria-label="EventPulse Features" 
            selectedKey={selected} 
            onSelectionChange={setSelected as any}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6",
              cursor: "w-full",
              tab: "max-w-fit px-0 h-12"
            }}
          >
            <Tab 
              key="contacts" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:users" />
                  <span>Contacts</span>
                </div>
              }
            />
            <Tab 
              key="events" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:calendar" />
                  <span>Events</span>
                </div>
              }
            />
            <Tab 
              key="reminders" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:bell" />
                  <span>Reminders</span>
                </div>
              }
            />
            <Tab 
              key="templates" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:mail" />
                  <span>Templates</span>
                </div>
              }
            />
          </Tabs>
          
          <div className="mt-8">
            <motion.div
              key={selected}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
            >
              <div>
                <h3 className="text-2xl font-bold mb-3">{steps[selected as keyof typeof steps].title}</h3>
                <p className="text-foreground-600 mb-6">{steps[selected as keyof typeof steps].description}</p>
                
                <ul className="space-y-3">
                  {steps[selected as keyof typeof steps].features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary-100 p-1 mt-1">
                        <Icon icon="lucide:check" className="text-primary text-sm" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Card className="shadow-lg border border-divider overflow-hidden">
                <CardBody className="p-0">
                  <img 
                    src={steps[selected as keyof typeof steps].image} 
                    alt={steps[selected as keyof typeof steps].title} 
                    className="w-full h-auto object-cover"
                  />
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};